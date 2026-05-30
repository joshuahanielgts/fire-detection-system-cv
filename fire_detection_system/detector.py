import os
import cv2
import numpy as np

class FireSmokeDetector:
    def __init__(self, model_path=None):
        self.yolo_available = False
        self.model = None
        
        try:
            import torch
            # Monkey-patch torch.load to disable default weights_only in PyTorch 2.6+
            if hasattr(torch, 'load'):
                _orig_load = torch.load
                def _patched_load(*args, **kwargs):
                    if 'weights_only' not in kwargs:
                        kwargs['weights_only'] = False
                    return _orig_load(*args, **kwargs)
                torch.load = _patched_load
                
            from ultralytics import YOLO
            
            # Paths to try in order:
            # 1. model_path argument
            # 2. ./fire_detection_system/yolov8n.pt
            # 3. ./yolov8n.pt
            # 4. Auto-download yolov8n.pt
            paths_to_try = []
            if model_path:
                paths_to_try.append(model_path)
            paths_to_try.append('./fire_detection_system/yolov8n.pt')
            paths_to_try.append('./yolov8n.pt')
            
            loaded = False
            for path in paths_to_try:
                if os.path.exists(path):
                    try:
                        self.model = YOLO(path)
                        loaded = True
                        break
                    except Exception:
                        pass
            
            if not loaded:
                # This will download yolov8n.pt to current directory
                self.model = YOLO('yolov8n.pt')
                
            self.yolo_available = True
        except (ImportError, Exception):
            self.yolo_available = False

    def detect(self, frame):
        """
        Takes a BGR numpy frame.
        If yolo_available, run _detect_yolo.
        Else run _detect_hsv.
        Return tuple: (annotated_frame, detections_list, alert_bool)
        """
        if self.yolo_available:
            return self._detect_yolo(frame)
        else:
            return self._detect_hsv(frame)

    def _detect_yolo(self, frame):
        """
        Run YOLO inference (verbose=False).
        For each detection, check if label contains "fire" or "smoke" with conf > 0.3.
        Draw colored bounding boxes (fire=orange-red BGR, smoke=gray BGR).
        If no fire/smoke labels found (general yolov8n), fall through to _detect_hsv.
        Return (annotated, detections_list, alert_bool).
        detections_list items: {label, confidence, bbox:[x1,y1,x2,y2]}
        """
        annotated = frame.copy()
        detections_list = []
        alert_bool = False
        
        try:
            results = self.model(frame, verbose=False)
        except Exception:
            # If YOLO inference fails, fall back to HSV
            return self._detect_hsv(frame)
            
        for r in results:
            boxes = r.boxes
            if boxes is not None:
                for box in boxes:
                    # Get confidence, class index
                    conf = float(box.conf[0].cpu().numpy())
                    cls = int(box.cls[0].cpu().numpy())
                    
                    # Map class to label
                    if hasattr(self.model, 'names') and cls in self.model.names:
                        label = self.model.names[cls]
                    else:
                        label = f"class_{cls}"
                        
                    label_lower = label.lower()
                    if ("fire" in label_lower or "smoke" in label_lower) and conf > 0.3:
                        # Bounding box coordinates
                        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy().tolist())
                        
                        # Colors: fire = orange-red BGR (0, 69, 255), smoke = gray BGR (128, 128, 128)
                        if "fire" in label_lower:
                            color = (0, 69, 255)
                        else:
                            color = (128, 128, 128)
                            
                        # Draw bounding box and text label
                        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                        text = f"{label}: {conf:.2f}"
                        cv2.putText(annotated, text, (x1, max(y1 - 5, 15)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                                    
                        detections_list.append({
                            "label": label,
                            "confidence": conf,
                            "bbox": [x1, y1, x2, y2]
                        })
                        alert_bool = True

        # If no fire/smoke labels found, fall through to _detect_hsv
        if not detections_list:
            return self._detect_hsv(frame)
            
        return annotated, detections_list, alert_bool

    def _detect_hsv(self, frame):
        """
        Convert to HSV.
        Fire mask: hue 0-20 + 160-180, sat 60-255, val 60-255.
        Smoke mask: hue 0-180, sat 0-40, val 80-210.
        Apply morphological open+dilate cleanup.
        Find contours, skip area < 800.
        Draw bounding boxes.
        Confidence = min(area/15000, 0.95).
        Return (annotated, detections_list, alert_bool)
        """
        annotated = frame.copy()
        detections_list = []
        alert_bool = False
        
        # Convert to HSV
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Fire mask (combines two Hue ranges: 0-20 and 160-180)
        lower_fire1 = np.array([0, 60, 60])
        upper_fire1 = np.array([20, 255, 255])
        lower_fire2 = np.array([160, 60, 60])
        upper_fire2 = np.array([180, 255, 255])
        
        mask_fire1 = cv2.inRange(hsv, lower_fire1, upper_fire1)
        mask_fire2 = cv2.inRange(hsv, lower_fire2, upper_fire2)
        fire_mask = cv2.bitwise_or(mask_fire1, mask_fire2)
        
        # Smoke mask: hue 0-180, sat 0-40, val 80-210
        lower_smoke = np.array([0, 0, 80])
        upper_smoke = np.array([180, 40, 210])
        smoke_mask = cv2.inRange(hsv, lower_smoke, upper_smoke)
        
        # Cleanup masks with morphological open (remove noise) and dilate (fill gaps)
        kernel = np.ones((5, 5), np.uint8)
        
        fire_mask = cv2.morphologyEx(fire_mask, cv2.MORPH_OPEN, kernel)
        fire_mask = cv2.dilate(fire_mask, kernel, iterations=1)
        
        smoke_mask = cv2.morphologyEx(smoke_mask, cv2.MORPH_OPEN, kernel)
        smoke_mask = cv2.dilate(smoke_mask, kernel, iterations=1)
        
        # Find external contours
        fire_contours, _ = cv2.findContours(fire_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        smoke_contours, _ = cv2.findContours(smoke_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Process fire contours
        for cnt in fire_contours:
            area = cv2.contourArea(cnt)
            if area < 800:
                continue
            x, y, w, h = cv2.boundingRect(cnt)
            conf = min(area / 15000.0, 0.95)
            color = (0, 69, 255) # orange-red BGR
            
            cv2.rectangle(annotated, (x, y), (x + w, y + h), color, 2)
            cv2.putText(annotated, f"fire: {conf:.2f}", (x, max(y - 5, 15)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                        
            detections_list.append({
                "label": "fire",
                "confidence": conf,
                "bbox": [x, y, x + w, y + h]
            })
            alert_bool = True
            
        # Process smoke contours
        for cnt in smoke_contours:
            area = cv2.contourArea(cnt)
            if area < 800:
                continue
            x, y, w, h = cv2.boundingRect(cnt)
            conf = min(area / 15000.0, 0.95)
            color = (128, 128, 128) # gray BGR
            
            cv2.rectangle(annotated, (x, y), (x + w, y + h), color, 2)
            cv2.putText(annotated, f"smoke: {conf:.2f}", (x, max(y - 5, 15)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                        
            detections_list.append({
                "label": "smoke",
                "confidence": conf,
                "bbox": [x, y, x + w, y + h]
            })
            alert_bool = True
            
        return annotated, detections_list, alert_bool
