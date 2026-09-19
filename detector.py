# detector.py
"""
Weapon and Hazardous Object Detection Module
Supports YOLO-World (Open-Vocabulary Zero-Shot), Custom YOLO models, and COCO Fallback.
"""

import os
import numpy as np
import torch
from ultralytics import YOLO
import config

class WeaponDetector:
    def __init__(self, mode=config.WEAPON_MODE, conf_thresh=config.WEAPON_CONF, imgsz=getattr(config, "WEAPON_IMGSZ", 320)):
        self.mode = mode
        self.conf_thresh = conf_thresh
        self.imgsz = imgsz
        self.model = None
        self.classes = []
        self._init_model()

    def _init_model(self):
        if self.mode == "yolo_world":
            try:
                print(f"[INFO] Initializing YOLO-World ({config.YOLO_WORLD_MODEL}) for zero-shot weapon detection...")
                self.model = YOLO(config.YOLO_WORLD_MODEL)
                self.classes = config.WEAPON_CLASSES
                # Set custom text queries for open vocabulary detection
                self.model.set_classes(self.classes)
                print(f"[INFO] YOLO-World configured for classes: {self.classes}")
            except Exception as e:
                print(f"[WARNING] Failed to load YOLO-World ({e}). Falling back to COCO dangerous items...")
                self.mode = "coco"
                self.model = YOLO(config.PERSON_MODEL)

        elif self.mode == "custom":
            if os.path.exists(config.CUSTOM_WEAPON_MODEL):
                print(f"[INFO] Loading custom weapon model: {config.CUSTOM_WEAPON_MODEL}")
                self.model = YOLO(config.CUSTOM_WEAPON_MODEL)
            else:
                print(f"[WARNING] Custom model '{config.CUSTOM_WEAPON_MODEL}' not found. Falling back to YOLO-World...")
                self.mode = "yolo_world"
                try:
                    self.model = YOLO(config.YOLO_WORLD_MODEL)
                    self.classes = config.WEAPON_CLASSES
                    self.model.set_classes(self.classes)
                except Exception as e:
                    print(f"[WARNING] Failed loading YOLO-World ({e}). Falling back to COCO...")
                    self.mode = "coco"
                    self.model = YOLO(config.PERSON_MODEL)

        elif self.mode == "coco":
            print("[INFO] Loading standard COCO model for weapon/tool tracking...")
            self.model = YOLO(config.PERSON_MODEL)

    def detect_weapons(self, frame):
        """
        Detects weapons and dangerous items in the current frame with optimized inference.
        Returns:
            list of [x1, y1, x2, y2, confidence, class_name]
        """
        if self.model is None:
            return []

        boxes = []
        try:
            with torch.inference_mode():
                if self.mode == "yolo_world":
                    results = self.model(frame, conf=self.conf_thresh, imgsz=self.imgsz, verbose=False)[0]
                    names = self.model.names
                    for box in results.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        class_name = names[cls_id] if isinstance(names, dict) else names[cls_id]
                        boxes.append([x1, y1, x2, y2, conf, str(class_name)])

                elif self.mode == "custom":
                    results = self.model(frame, conf=self.conf_thresh, imgsz=self.imgsz, verbose=False)[0]
                    names = self.model.names
                    for box in results.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        class_name = names[cls_id] if isinstance(names, dict) else str(cls_id)
                        boxes.append([x1, y1, x2, y2, conf, str(class_name)])

                elif self.mode == "coco":
                    # COCO classes: 43 = knife, 34 = baseball bat, 76 = scissors
                    danger_classes = [34, 43, 76]
                    results = self.model(frame, conf=self.conf_thresh, imgsz=self.imgsz, classes=danger_classes, verbose=False)[0]
                    names = self.model.names
                    for box in results.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        class_name = names[cls_id]
                        boxes.append([x1, y1, x2, y2, conf, str(class_name)])
        except Exception as e:
            print(f"[DETECTOR ERROR] {e}")

        return boxes
