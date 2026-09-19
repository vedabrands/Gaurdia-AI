# test_tracker.py
"""
Quick Diagnostic / Test Script:
Verifies webcam, YOLO-Pose tracking, and skeleton visualization without alerts.
"""

import cv2
import time
from tracker_utils import PoseTrackerpython 
import config

def main():
    print("[INFO] Starting test tracker with model:", config.POSE_MODEL)
    tracker = PoseTracker(model_path=config.POSE_MODEL, conf=config.PERSON_CONF)
    cap = cv2.VideoCapture(config.VIDEO_SOURCE)

    if not cap.isOpened():
        print(f"[ERROR] Could not open video source: {config.VIDEO_SOURCE}")
        return

    print("[INFO] Test running. Press 'q' to exit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        people = tracker.track(frame)
        for p in people:
            x1, y1, x2, y2 = map(int, p["box"])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"ID {p['id']} ({p['conf']:.2f})", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            kp = p.get("keypoints")
            if kp is not None:
                for pt in kp:
                    if pt[2] > 0.4:
                        cv2.circle(frame, (int(pt[0]), int(pt[1])), 4, (0, 0, 255), -1)

        cv2.imshow("Tracker Test", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
