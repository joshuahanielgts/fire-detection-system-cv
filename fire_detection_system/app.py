import gradio as gr
import cv2
import numpy as np
from detector import FireSmokeDetector
import time

# Global state
alert_log = []
fps_counter = 0
fps_start_time = time.time()

# Single detector instance to prevent memory leak
detector = FireSmokeDetector(model_path='yolov8n.pt', conf_threshold=0.6)


def process_frame(frame, threshold):
    """
    Process single frame for Gradio live detection.
    """
    global alert_log, fps_counter, fps_start_time

    if frame is None:
        return None, "No frame", []

    # Update threshold if changed
    detector.conf_threshold = float(threshold)

    # Convert RGB to BGR for OpenCV
    if isinstance(frame, np.ndarray):
        if frame.shape[-1] == 3:
            frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        else:
            frame_bgr = frame
    else:
        return None, "Invalid frame", []

    # Run detection
    annotated_frame, fire_detected, smoke_detected, detections = detector.detect(frame_bgr)

    # FPS calculation
    fps_counter += 1
    current_fps = 0.0
    if fps_counter % 30 == 0:
        elapsed = time.time() - fps_start_time
        if elapsed > 0:
            current_fps = 30 / elapsed
        fps_start_time = time.time()

    # Add alerts
    timestamp = time.strftime('%H:%M:%S')
    if fire_detected:
        alert = f"FIRE DETECTED at {timestamp} ({len(detections)} objects)"
        alert_log.append(alert)
        print(alert)
    if smoke_detected:
        alert = f"SMOKE DETECTED at {timestamp} ({len(detections)} objects)"
        alert_log.append(alert)
        print(alert)

    status = f"Detections: {len(detections)} | FPS: {current_fps:.1f} | Threshold: {threshold:.2f}"
    recent_alerts = alert_log[-10:]

    return cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB), status, recent_alerts


def clear_alerts():
    global alert_log
    alert_log = []
    return []


def create_dashboard():
    theme = gr.themes.Dark(
        primary_hue="red",
        secondary_hue="orange",
        neutral_hue="gray"
    )

    with gr.Blocks(theme=theme, title="AI Fire Detection Dashboard") as demo:
        gr.Markdown("""
        # AI Fire & Smoke Detection Dashboard
        *Real-time detection using YOLOv8 and OpenCV*
        **Features:** Live webcam processing, stats, adjustable confidence threshold
        """)

        with gr.Tabs():
            with gr.TabItem("LIVE DETECTION"):
                with gr.Row(equal_height=True):
                    with gr.Column(scale=1):
                        webcam_input = gr.Image(
                            label="Webcam Feed",
                            sources=["webcam"],
                            streaming=True,
                            height=480
                        )
                        threshold_slider = gr.Slider(
                            0.1, 1.0, 0.6, 0.05,
                            label="Detection Confidence",
                            interactive=True
                        )
                    with gr.Column(scale=1):
                        detection_output = gr.Image(
                            label="AI Analysis Output",
                            streaming=True,
                            height=480
                        )
                        live_status = gr.Textbox(
                            label="Live Status",
                            interactive=False,
                            lines=1
                        )

                with gr.Row():
                    snapshot_btn = gr.Button("Take Snapshot", variant="secondary")
                    clear_btn = gr.Button("Clear Alerts", variant="secondary")

                snapshot_img = gr.Image(label="Saved Frame", height=300)

            with gr.TabItem("ALERT HISTORY"):
                alerts_display = gr.Textbox(
                    label="Recent Alerts",
                    lines=10,
                    interactive=False
                )
                with gr.Row():
                    gr.Button("Clear History", variant="stop").click(
                        fn=clear_alerts,
                        outputs=alerts_display
                    )

            with gr.TabItem("SETTINGS"):
                gr.Markdown("""
                ### Controls
                - **Model**: yolov8n.pt (change in detector.py)
                - **Hotkeys**: F11 (fullscreen)
                - **Mobile**: Fully responsive
                """)
                gr.Number(label="Total Alerts", value=len(alert_log), interactive=False)

        # Event handlers
        snapshot_btn.click(
            fn=lambda img: img,
            inputs=webcam_input,
            outputs=snapshot_img
        )

        clear_btn.click(
            fn=clear_alerts,
            outputs=alerts_display
        )

        # Main live processing using stream
        webcam_input.stream(
            fn=process_frame,
            inputs=[webcam_input, threshold_slider],
            outputs=[detection_output, live_status, alerts_display],
            time_limit=60
        )

    return demo


if __name__ == '__main__':
    app = create_dashboard()
    app.launch(
        server_port=7860,
        server_name='127.0.0.1',
        share=False,
        show_error=True
    )
    print("Dashboard ready at http://127.0.0.1:7860")

