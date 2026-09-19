# main.py
"""
Main Application Pipeline: Real-time CCTV / Camera Safety Monitor
Combines High-FPS Person Tracking, Skeleton Pose Analysis, Weapon & Dangerous Item Detection,
Offline Voice Automation ("ALERT EMERGENCY DETECTED"), and Asynchronous WhatsApp Alerts.
"""

import cv2
import time
import numpy as np
from collections import defaultdict

import config
from tracker_utils import PoseTracker
from detector import WeaponDetector
from pose_action import ActionAnalyzer
from alert import AlertManager

# ASGI application alias for Vercel / serverless cloud deployments
try:
    from api_server import app
except Exception:
    app = None

# Skeleton connection pairs for drawing COCO 17 keypoints
SKELETON_CONNECTIONS = [
    (0, 1), (0, 2), (1, 3), (2, 4),               # Head / Facial features
    (5, 6), (5, 7), (7, 9), (6, 8), (8, 10),      # Arms / Shoulders
    (5, 11), (6, 12), (11, 12),                   # Torso
    (11, 13), (13, 15), (12, 14), (14, 16)        # Legs
]

def boxes_proximity(box_a, box_b, thresh):
    """Calculates if center of box_a is within threshold distance of box_b."""
    ca = np.array([(box_a[0] + box_a[2]) / 2.0, (box_a[1] + box_a[3]) / 2.0])
    cb = np.array([(box_b[0] + box_b[2]) / 2.0, (box_b[1] + box_b[3]) / 2.0])
    return np.linalg.norm(ca - cb) < thresh

def draw_skeleton(frame, keypoints, color=(0, 255, 255)):
    """Draws keypoints and skeleton bones on frame."""
    if keypoints is None or len(keypoints) < 17:
        return

    # Draw connection lines
    for p1, p2 in SKELETON_CONNECTIONS:
        if p1 < len(keypoints) and p2 < len(keypoints):
            k1 = keypoints[p1]
            k2 = keypoints[p2]
            if k1[2] > 0.4 and k2[2] > 0.4:
                pt1 = (int(k1[0]), int(k1[1]))
                pt2 = (int(k2[0]), int(k2[1]))
                cv2.line(frame, pt1, pt2, color, 2)

    # Draw landmark joints
    for pt in keypoints:
        if pt[2] > 0.4:
            cv2.circle(frame, (int(pt[0]), int(pt[1])), 4, (0, 0, 255), -1)

def main():
    print("=" * 60)
    print("🛡️  STARTING AI SECURITY, VIOLENCE & WEAPON SURVEILLANCE")
    print("=" * 60)

    # Initialize components with optimized FPS settings
    tracker = PoseTracker(model_path=config.POSE_MODEL, conf=config.PERSON_CONF, imgsz=getattr(config, "POSE_IMGSZ", 384))
    weapon_detector = WeaponDetector(mode=config.WEAPON_MODE, conf_thresh=config.WEAPON_CONF, imgsz=getattr(config, "WEAPON_IMGSZ", 320))
    action_analyzer = ActionAnalyzer(
        window=getattr(config, "FIGHT_WINDOW", 15),
        velocity_thresh=getattr(config, "STRIKE_VELOCITY_THRESH", 30.0)
    )
    alert_mgr = AlertManager()

    cap = cv2.VideoCapture(config.VIDEO_SOURCE)
    if not cap.isOpened():
        print(f"[ERROR] Could not open video source: {config.VIDEO_SOURCE}")
        return

    # Request camera capture resolution if using webcam
    if isinstance(config.VIDEO_SOURCE, int):
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, getattr(config, "CAMERA_WIDTH", 1280))
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, getattr(config, "CAMERA_HEIGHT", 720))

    # Initialize resizable OpenCV window with Fullscreen capabilities
    window_name = getattr(config, "WINDOW_TITLE", "AI Safety & Weapon Surveillance")
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, getattr(config, "DISPLAY_WIDTH", 1280), getattr(config, "DISPLAY_HEIGHT", 720))

    is_fullscreen = getattr(config, "START_FULLSCREEN", False)
    if is_fullscreen:
        cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    # Persistence counters to avoid false positive blips
    consec_choke_count = 0
    consec_fight_count = 0
    consec_weapon_count = 0
    consec_fall_count = 0

    fps_history = []
    prev_time = time.time()
    frame_count = 0
    cached_weapons = []
    weapon_interval = getattr(config, "WEAPON_CHECK_INTERVAL", 3)

    print(f"[INFO] Camera started at {int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}.")
    print(f"[INFO] Performance Optimization: Pose ImgSz={getattr(config, 'POSE_IMGSZ', 384)}, Weapon Interval={weapon_interval}.")
    print("[INFO] Controls: 'f' = Toggle Fullscreen | 's' = Save Snapshot | 'q' = Exit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[INFO] End of video stream or camera disconnected.")
            break

        current_time = time.time()
        fps = 1.0 / max(0.001, (current_time - prev_time))
        prev_time = current_time
        fps_history.append(fps)
        if len(fps_history) > 30:
            fps_history.pop(0)
        avg_fps = sum(fps_history) / len(fps_history)

        display_frame = frame.copy()
        h, w = frame.shape[:2]

        # 1. Track Persons & Keypoint Skeletons (High FPS YOLO-Pose)
        people = tracker.track(frame)

        # 2. Detect Weapons & Dangerous Items (Cadence execution for 30+ FPS)
        if frame_count % weapon_interval == 0:
            cached_weapons = weapon_detector.detect_weapons(frame)
        weapons = cached_weapons
        frame_count += 1

        # 3. Analyze Behavior / Violence / Neck Grabs / Falls
        action_results = action_analyzer.update(people)
        fight_detected = action_results["fight_detected"]
        neck_hold_detected = action_results.get("neck_hold_detected", False)
        choke_events = action_results.get("choke_events", [])
        choking_ids = action_results.get("choking_ids", [])
        victim_ids = action_results.get("victim_ids", [])
        aggressive_ids = action_results["aggressive_ids"]
        fallen_ids = action_results["fallen_ids"]

        # 4. Check Weapon-Person Proximity & Association
        weapon_held = False
        detected_weapon_names = []

        for w_box in weapons:
            wx1, wy1, wx2, wy2, wconf, wname = w_box
            detected_weapon_names.append(wname)

            # Draw weapon bounding box in bright red with hazard label
            cv2.rectangle(display_frame, (int(wx1), int(wy1)), (int(wx2), int(wy2)), (0, 0, 255), 3)
            label = f"HAZARD: {wname.upper()} ({wconf:.2f})"
            (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(display_frame, (int(wx1), int(wy1) - 25), (int(wx1) + lw, int(wy1)), (0, 0, 255), -1)
            cv2.putText(display_frame, label, (int(wx1), int(wy1) - 7),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            # Association with nearby person
            for p in people:
                if boxes_proximity(w_box[:4], p["box"], config.PROXIMITY_PX):
                    weapon_held = True
                    pc = ((int(p["box"][0]) + int(p["box"][2])) // 2, (int(p["box"][1]) + int(p["box"][3])) // 2)
                    wc = ((int(wx1) + int(wx2)) // 2, (int(wy1) + int(wy2)) // 2)
                    cv2.line(display_frame, pc, wc, (0, 0, 255), 2, cv2.LINE_AA)

        # Update persistence counters
        consec_weapon_count = (consec_weapon_count + 1) if (len(weapons) > 0) else 0
        consec_choke_count = (consec_choke_count + 1) if neck_hold_detected else 0
        consec_fight_count = (consec_fight_count + 1) if fight_detected else 0
        consec_fall_count = (consec_fall_count + 1) if (len(fallen_ids) > 0) else 0

        # 5. Render People Bounding Boxes & Skeletons
        for p in people:
            pid = p["id"]
            x1, y1, x2, y2 = map(int, p["box"])
            kp = p.get("keypoints")

            # Determine color status
            if pid in choking_ids:
                box_color = (0, 0, 255)    # Red for choking aggressor
                status_text = f"ID {pid} [AGGRESSOR: CHOKING/NECK HOLD]"
            elif pid in victim_ids:
                box_color = (0, 215, 255)  # Gold/Cyan-Yellow for victim being held
                status_text = f"ID {pid} [VICTIM: NECK HELD]"
            elif pid in aggressive_ids:
                box_color = (0, 140, 255)  # Orange for aggressive/fight
                status_text = f"ID {pid} [AGGRESSIVE: FIGHTING]"
            elif pid in fallen_ids:
                box_color = (255, 0, 255)  # Magenta for fall
                status_text = f"ID {pid} [FALLEN]"
            else:
                box_color = (0, 255, 0)    # Green for normal
                status_text = f"ID {pid} [NORMAL]"

            # Draw person box & label
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), box_color, 2)
            cv2.putText(display_frame, status_text, (x1, max(15, y1 - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, box_color, 2)

            # Draw skeleton pose
            if kp is not None:
                draw_skeleton(display_frame, kp, color=box_color)

        # 6. Render Specialized Neck Hold / Choking Graphical Target Overlays
        for ev in choke_events:
            c_pts = ev.get("contact_points")
            if c_pts and len(c_pts) == 2:
                p_wrist, p_neck = c_pts
                w_pt = (int(p_wrist[0]), int(p_wrist[1]))
                n_pt = (int(p_neck[0]), int(p_neck[1]))

                # Draw aggressive contact line from hand/wrist to victim throat/neck locus
                cv2.line(display_frame, w_pt, n_pt, (0, 0, 255), 3, cv2.LINE_AA)

                # Draw concentric target rings / bullseye on the neck/choke contact locus
                cv2.circle(display_frame, n_pt, 14, (0, 0, 255), 2, cv2.LINE_AA)
                cv2.circle(display_frame, n_pt, 6, (0, 0, 255), -1, cv2.LINE_AA)

                # Label the choke point
                hold_lbl = f"⚡ {ev['type'].replace('_', ' ')}"
                cv2.putText(display_frame, hold_lbl, (n_pt[0] + 16, n_pt[1] - 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        # 7. Threat Evaluation & Multi-Tier Alerts
        status_banner = "SYSTEM STATUS: NORMAL"
        banner_color = (0, 180, 0)

        min_choke_frames = getattr(config, "MIN_CONSEC_CHOKE_FRAMES", 3)

        # Tier 1: Weapon + Violent / Physical Altercation (CRITICAL)
        if consec_weapon_count >= config.MIN_CONSEC_FRAMES and (consec_fight_count >= config.MIN_CONSEC_FRAMES or consec_choke_count >= min_choke_frames):
            status_banner = "🚨 CRITICAL: ARMED VIOLENCE DETECTED!"
            banner_color = (0, 0, 255)
            weapon_list_str = ", ".join(set(detected_weapon_names))
            alert_mgr.trigger_alert(
                f"Critical Threat: Armed physical violence detected in camera! Weapons identified: {weapon_list_str}",
                frame=display_frame,
                threat_type="ARMED VIOLENCE"
            )

        # Tier 2: Neck Hold / Choking Assault Detected (High Priority Aggression)
        elif consec_choke_count >= min_choke_frames:
            status_banner = "🚨 AGGRESSIVE ASSAULT: NECK HOLD / CHOKING DETECTED!"
            banner_color = (0, 0, 255)
            choke_details = action_results.get("details", "Neck grab / choke hold in progress")
            alert_mgr.trigger_alert(
                f"Violence Alert: Physical aggression detected! {choke_details}",
                frame=display_frame,
                threat_type="NECK HOLD / CHOKING"
            )

        # Tier 3: Weapon Detected
        elif consec_weapon_count >= config.MIN_CONSEC_FRAMES:
            status_banner = "⚠️ WEAPON / HAZARDOUS ITEM DETECTED"
            banner_color = (0, 0, 255)
            weapon_list_str = ", ".join(set(detected_weapon_names))
            alert_mgr.trigger_alert(
                f"Weapon Alert: Dangerous item ({weapon_list_str}) detected in camera view!",
                frame=display_frame,
                threat_type="WEAPON DETECTED"
            )

        # Tier 4: General Physical Fight / Violent Striking Detected
        elif consec_fight_count >= config.MIN_CONSEC_FRAMES:
            status_banner = "⚠️ PHYSICAL ALTERCATION / FIGHT DETECTED"
            banner_color = (0, 140, 255)
            alert_mgr.trigger_alert(
                f"Violence Alert: Physical fight or violent assault behavior detected between persons!",
                frame=display_frame,
                threat_type="FIGHT DETECTED"
            )

        # Tier 5: Fall / Knockdown Detected
        elif consec_fall_count >= (config.MIN_CONSEC_FRAMES * 2):
            status_banner = "⚠️ PERSON DOWN / FALL DETECTED"
            banner_color = (255, 0, 255)
            alert_mgr.trigger_alert(
                f"Medical/Safety Alert: Person knockdown or fall detected!",
                frame=display_frame,
                threat_type="FALL DETECTED"
            )

        # 8. Draw Professional Heads-Up Display (HUD)
        # Top banner
        cv2.rectangle(display_frame, (0, 0), (w, 40), banner_color, -1)
        cv2.putText(display_frame, status_banner, (15, 26),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        # Info footer
        choke_stat = f" | Choke/Holds: {len(choke_events)}" if len(choke_events) > 0 else ""
        info_str = f"FPS: {avg_fps:.1f} | People: {len(people)}{choke_stat} | Weapons: {len(weapons)} | Mode: {config.WEAPON_MODE} | [F] Fullscreen [S] Snap [Q] Exit"
        cv2.rectangle(display_frame, (0, h - 30), (w, h), (30, 30, 30), -1)
        cv2.putText(display_frame, info_str, (15, h - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, (200, 200, 200), 1)

        # Display output in resizable window
        cv2.imshow(window_name, display_frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('f'):
            is_fullscreen = not is_fullscreen
            if is_fullscreen:
                cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
                print("[INFO] Switched to FULLSCREEN mode.")
            else:
                cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                cv2.resizeWindow(window_name, getattr(config, "DISPLAY_WIDTH", 1280), getattr(config, "DISPLAY_HEIGHT", 720))
                print("[INFO] Restored to WINDOWED mode.")
        elif key == ord('s'):
            snap_path = f"manual_snapshot_{int(time.time())}.jpg"
            cv2.imwrite(snap_path, display_frame)
            print(f"[INFO] Manual snapshot saved to {snap_path}")

    cap.release()
    cv2.destroyAllWindows()
    action_analyzer.close()
    print("[INFO] Safety Monitor shutdown completed.")

if __name__ == "__main__":
    main()
