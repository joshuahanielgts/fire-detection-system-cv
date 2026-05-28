import cv2
from detector import FireSmokeDetector
import time

def main():
    """
    Main function to run the fire/smoke detection system.
    Captures webcam feed and displays detections in real-time.
    """
    # Initialize detector
    detector = FireSmokeDetector(model_path='yolov8n.pt', conf_threshold=0.6)

    print("Pro Tip: For real fire/smoke detection, download a specialized model")

    # Open webcam (try multiple camera indices: 0, 1, 2)
    import os
    cap = None
    for index in [0, 1, 2]:
        try:
            if os.name == 'nt':
                cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
            else:
                cap = cv2.VideoCapture(index)
                
            if cap is None or not cap.isOpened():
                cap = cv2.VideoCapture(index)
                
            if cap is not None and cap.isOpened():
                print(f"Webcam opened successfully at index {index}")
                break
        except Exception as e:
            print(f"Failed to open webcam at index {index}: {e}")

    if cap is None or not cap.isOpened():
        print("Error: Could not open webcam")
        print("Tip: Check if camera is connected and not used by another app")
        return

    print("Webcam opened successfully")
    print("Press 'q' to quit")
    print("-" * 50)

    frame_count = 0
    fps_time = time.time()

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Failed to capture frame")
                break

            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)

            # Perform detection
            annotated_frame, fire_detected, smoke_detected, detections = detector.detect(frame)

            # Calculate FPS
            frame_count += 1
            if frame_count % 30 == 0:
                fps = 30 / (time.time() - fps_time)
                fps_time = time.time()
                fps_text = f"FPS: {fps:.1f}"
            else:
                fps_text = "FPS: --"

            # Add status text
            status_y = 30
            cv2.putText(annotated_frame, fps_text, (10, status_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            status_y += 40

            # Fire alert
            if fire_detected:
                cv2.putText(annotated_frame, "FIRE DETECTED!", (10, status_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                print("FIRE DETECTED!")
                status_y += 50

            # Smoke alert
            if smoke_detected:
                cv2.putText(annotated_frame, "SMOKE DETECTED!", (10, status_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 3)
                print("SMOKE DETECTED!")
                status_y += 50

            # Detection count
            if detections:
                det_text = f"Detections: {len(detections)}"
                cv2.putText(annotated_frame, det_text, (10, status_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

            # Display the frame
            cv2.imshow('Fire & Smoke Detection System (Press Q to quit)', annotated_frame)

            # Break on 'q' key press
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        print("Application closed successfully")

if __name__ == "__main__":
    main()

