# tracker_utils.py
"""
Multi-Person Tracking with Keypoints & Bounding Boxes using YOLOv8 / YOLO-Pose.
"""

from ultralytics import YOLO
import numpy as np
import torch
import config

class PoseTracker:
    def __init__(self, model_path=config.POSE_MODEL, conf=config.PERSON_CONF, imgsz=getattr(config, "POSE_IMGSZ", 384)):
        self.conf = conf
        self.imgsz = imgsz
        print(f"[INFO] Initializing Pose Tracker ({model_path}, imgsz={self.imgsz})...")
        self.model = YOLO(model_path)

    def track(self, frame):
        """
        Runs tracking on the frame using ByteTrack with optimized inference.
        Returns:
            list of dicts: [
                {
                    'id': int (tracking id),
                    'box': [x1, y1, x2, y2],
                    'conf': float,
                    'keypoints': np.ndarray of shape (17, 3) -> [[x, y, conf], ...] or None
                }
            ]
        """
        with torch.inference_mode():
            results = self.model.track(
                frame,
                persist=True,
                conf=self.conf,
                imgsz=self.imgsz,
                classes=[0],           # Person class
                tracker="bytetrack.yaml",
                verbose=False
            )[0]

        tracked = []
        if results.boxes is not None and results.boxes.id is not None:
            ids = results.boxes.id.int().tolist()
            boxes = results.boxes.xyxy.cpu().numpy()
            confs = results.boxes.conf.cpu().numpy()

            # Check if pose keypoints are present (when using yolov8-pose model)
            has_keypoints = results.keypoints is not None and len(results.keypoints) > 0
            keypoints_data = results.keypoints.data.cpu().numpy() if has_keypoints else None

            for i, tid in enumerate(ids):
                kp = keypoints_data[i] if (has_keypoints and i < len(keypoints_data)) else None
                tracked.append({
                    "id": tid,
                    "box": boxes[i].tolist(),
                    "conf": float(confs[i]),
                    "keypoints": kp
                })

        return tracked
