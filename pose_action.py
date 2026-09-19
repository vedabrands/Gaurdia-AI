# pose_action.py
"""
High-Precision Action & Violence Analyzer:
Accurately identifies and separates Aggressors from Victims and Bystanders.
- Detects specialized physical aggression: Neck Holds, Choking (One-handed & Two-handed), Headlocks
- Distinguishes between the person holding the neck (Aggressor) and the person being held (Victim)
- Rejects self-touches (scratching neck, phone calls, adjusting collar) and simple proximity
- Tracks active aggressive strikers (punching/attacking) vs victims vs normal peaceful individuals
"""

import numpy as np
from collections import defaultdict, deque
import config


class ActionAnalyzer:
    def __init__(self, window=getattr(config, "FIGHT_WINDOW", 15), velocity_thresh=getattr(config, "STRIKE_VELOCITY_THRESH", 30.0)):
        self.window = window
        self.velocity_thresh = velocity_thresh
        # History of {track_id: deque([ { 'box': [...], 'kp': ..., 'center': ..., 'height': ..., 'width': ... } ])}
        self.history = defaultdict(lambda: deque(maxlen=self.window))
        # Temporal persistence counter for choke pairs: {(agg_id, vic_id): consecutive_frame_count}
        self.choke_persistence = defaultdict(int)

    def update(self, people):
        """
        Analyzes motion, anatomical pose contacts, neck grabs/choking, and falls across tracked people.

        Args:
            people: list of dicts [{'id': int, 'box': [x1, y1, x2, y2], 'keypoints': array or None}]

        Returns:
            dict: {
                'fight_detected': bool,
                'neck_hold_detected': bool,
                'strike_detected': bool,
                'choke_events': list of dict,
                'choking_aggressor_ids': list of int,
                'choking_victim_ids': list of int,
                'striking_aggressor_ids': list of int,
                'striking_victim_ids': list of int,
                'aggressive_ids': list of int,
                'victim_ids': list of int,
                'fallen_ids': list of int,
                'details': str
            }
        """
        active_ids = {p["id"] for p in people}

        # Clean up stale history and persistence trackers
        for tid in list(self.history.keys()):
            if tid not in active_ids:
                del self.history[tid]

        for pair in list(self.choke_persistence.keys()):
            if pair[0] not in active_ids or pair[1] not in active_ids:
                del self.choke_persistence[pair]

        choking_aggressor_ids = []
        choking_victim_ids = []
        striking_aggressor_ids = []
        striking_victim_ids = []
        fallen_ids = []
        choke_events = []

        # 1. Update temporal history for active tracks
        for p in people:
            tid = p["id"]
            box = p["box"]
            kp = p.get("keypoints")

            x1, y1, x2, y2 = box
            w = max(1.0, x2 - x1)
            h = max(1.0, y2 - y1)
            center = np.array([(x1 + x2) / 2.0, (y1 + y2) / 2.0])

            self.history[tid].append({
                "box": box,
                "center": center,
                "width": w,
                "height": h,
                "keypoints": kp
            })

            # Check knockdown / fall detection
            if self._check_fall(tid):
                fallen_ids.append(tid)

        # 2. Pairwise Anatomical Interaction & Aggression Scanning
        current_frame_choke_pairs = set()

        for i in range(len(people)):
            for j in range(len(people)):
                if i == j:
                    continue

                p_agg = people[i]
                p_vic = people[j]
                id_agg = p_agg["id"]
                id_vic = p_vic["id"]

                # Distance check between bounding box centers
                c1 = np.array([(p_agg["box"][0] + p_agg["box"][2]) / 2.0,
                               (p_agg["box"][1] + p_agg["box"][3]) / 2.0])
                c2 = np.array([(p_vic["box"][0] + p_vic["box"][2]) / 2.0,
                               (p_vic["box"][1] + p_vic["box"][3]) / 2.0])
                dist = np.linalg.norm(c1 - c2)

                # Only evaluate when persons are within interacting proximity
                if dist < getattr(config, "INTERACTION_DIST_PX", 250) or self._boxes_intersect(p_agg["box"], p_vic["box"]):

                    # A. High-Precision Neck Hold / Choking / Headlock Detection
                    is_choking, hold_type, contact_pts = self._check_neck_hold(p_agg, p_vic)

                    if is_choking:
                        pair = (id_agg, id_vic)
                        current_frame_choke_pairs.add(pair)
                        self.choke_persistence[pair] += 1

                        # Require at least 2 consecutive frames to confirm hold (filters momentary arm passes)
                        if self.choke_persistence[pair] >= 2:
                            choke_events.append({
                                "aggressor_id": id_agg,
                                "victim_id": id_vic,
                                "type": hold_type,
                                "contact_points": contact_pts
                            })
                            if id_agg not in choking_aggressor_ids:
                                choking_aggressor_ids.append(id_agg)
                            if id_vic not in choking_victim_ids:
                                choking_victim_ids.append(id_vic)
                    else:
                        self.choke_persistence[(id_agg, id_vic)] = max(0, self.choke_persistence[(id_agg, id_vic)] - 1)

                    # B. Check Active Kinetic Striking / Punching Attack
                    if id_agg not in choking_aggressor_ids:
                        is_striking = self._check_striking_attack(p_agg, p_vic)
                        if is_striking:
                            if id_agg not in striking_aggressor_ids:
                                striking_aggressor_ids.append(id_agg)
                            if id_vic not in striking_victim_ids:
                                striking_victim_ids.append(id_vic)

        neck_hold_detected = len(choke_events) > 0
        strike_detected = len(striking_aggressor_ids) > 0
        fight_detected = neck_hold_detected or strike_detected

        details = []
        if choke_events:
            for ev in choke_events:
                details.append(f"Person ID {ev['aggressor_id']} [{ev['type']}] on Person ID {ev['victim_id']}")
        if striking_aggressor_ids:
            for agg_id in striking_aggressor_ids:
                details.append(f"Person ID {agg_id} attacking an opponent")
        if fallen_ids:
            details.append(f"Person(s) Fallen: {fallen_ids}")

        all_aggressors = list(set(choking_aggressor_ids + striking_aggressor_ids))
        all_victims = list(set(choking_victim_ids + striking_victim_ids))

        return {
            "fight_detected": fight_detected,
            "neck_hold_detected": neck_hold_detected,
            "strike_detected": strike_detected,
            "choke_events": choke_events,
            "choking_aggressor_ids": choking_aggressor_ids,
            "choking_victim_ids": choking_victim_ids,
            "striking_aggressor_ids": striking_aggressor_ids,
            "striking_victim_ids": striking_victim_ids,
            "aggressive_ids": all_aggressors,
            "victim_ids": all_victims,
            "choking_ids": choking_aggressor_ids,
            "fallen_ids": fallen_ids,
            "details": "; ".join(details) if details else "Normal"
        }

    def _get_neck_position(self, kp, box):
        """
        Calculates anatomical neck/throat locus using COCO-17 keypoints:
        - 0: Nose
        - 5: Left Shoulder
        - 6: Right Shoulder
        Returns: (np.ndarray(x, y), bool has_accurate_kp)
        """
        min_conf = getattr(config, "KEYPOINT_CONF", 0.30)
        if kp is not None and len(kp) >= 17:
            has_nose = kp[0][2] > min_conf
            has_l_sh = kp[5][2] > min_conf
            has_r_sh = kp[6][2] > min_conf

            if has_l_sh and has_r_sh:
                sh_mid = (kp[5][:2] + kp[6][:2]) / 2.0
                if has_nose:
                    # Anatomical throat sits between shoulder midpoint and chin/nose
                    return (sh_mid * 0.65 + kp[0][:2] * 0.35), True
                else:
                    h = max(20.0, box[3] - box[1])
                    return (sh_mid - np.array([0, h * 0.05])), True
            elif has_nose:
                h = max(20.0, box[3] - box[1])
                return (kp[0][:2] + np.array([0, h * 0.12])), True

        # Fallback to upper bounding box estimation
        x1, y1, x2, y2 = box
        return np.array([(x1 + x2) / 2.0, y1 + (y2 - y1) * 0.18]), False

    def _check_neck_hold(self, p_agg, p_vic):
        """
        Evaluates if Person 1 (p_agg) has placed their hands/wrists on Person 2's (p_vic) neck or head.
        Rejects self-touch and accidental background alignment.

        Returns: (bool is_holding, str hold_type, tuple (wrist_pos, target_pos))
        """
        kp1 = p_agg.get("keypoints")
        kp2 = p_vic.get("keypoints")
        box1 = p_agg["box"]
        box2 = p_vic["box"]
        h2 = max(20.0, box2[3] - box2[1])

        # Require valid keypoints on both persons
        if kp1 is None or kp2 is None or len(kp1) < 17 or len(kp2) < 17:
            return False, None, None

        min_conf = getattr(config, "KEYPOINT_CONF", 0.30)
        vic_neck_pos, vic_has_kp = self._get_neck_position(kp2, box2)
        own_neck_pos, own_has_kp = self._get_neck_position(kp1, box1)

        ratio = getattr(config, "NECK_HOLD_RATIO", 0.22)
        neck_thresh = max(28.0, h2 * ratio)
        head_thresh = max(34.0, h2 * (ratio + 0.04))

        # Check Aggressor Wrists: KP 9 (Left Wrist), KP 10 (Right Wrist)
        wrist_candidates = []
        if kp1[9][2] > min_conf:
            wrist_candidates.append(("left", kp1[9][:2], kp1[7][:2] if kp1[7][2] > min_conf else None))
        if kp1[10][2] > min_conf:
            wrist_candidates.append(("right", kp1[10][:2], kp1[8][:2] if kp1[8][2] > min_conf else None))

        if not wrist_candidates:
            return False, None, None

        touching_wrists = []
        detected_type = None

        for arm_side, w_pos, elb_pos in wrist_candidates:
            d_to_vic_neck = np.linalg.norm(w_pos - vic_neck_pos)
            d_to_own_neck = np.linalg.norm(w_pos - own_neck_pos)

            # 1. SELF-TOUCH FILTER:
            # If wrist is closer to the person's own neck, they are touching their own face/neck
            if d_to_own_neck < (d_to_vic_neck * 0.90):
                continue

            # 2. Check direct grip on victim's neck/throat
            if d_to_vic_neck <= neck_thresh:
                touching_wrists.append(w_pos)
                detected_type = "NECK_HOLD"
                continue

            # 3. Check direct grab on victim's head/face
            if kp2[0][2] > min_conf:
                d_to_vic_head = np.linalg.norm(w_pos - kp2[0][:2])
                if d_to_vic_head <= head_thresh:
                    touching_wrists.append(w_pos)
                    detected_type = "HEAD_GRAB"
                    continue

        # Two-handed choke
        if len(touching_wrists) >= 2:
            return True, "TWO_HANDED_CHOKE", (touching_wrists[0], vic_neck_pos)

        # Single-hand neck grab / head grab
        if len(touching_wrists) == 1:
            return True, detected_type or "ONE_HANDED_NECK_HOLD", (touching_wrists[0], vic_neck_pos)

        # 4. Check Headlock (Aggressor's forearm / elbow wrapped around victim's neck)
        for arm_side, w_pos, elb_pos in wrist_candidates:
            if elb_pos is not None:
                arm_mid = (w_pos + elb_pos) / 2.0
                d_mid_to_vic = np.linalg.norm(arm_mid - vic_neck_pos)
                d_mid_to_own = np.linalg.norm(arm_mid - own_neck_pos)
                if d_mid_to_vic <= neck_thresh and d_mid_to_vic < d_mid_to_own:
                    return True, "HEADLOCK", (arm_mid, vic_neck_pos)

        return False, None, None

    def _check_striking_attack(self, p_agg, p_vic):
        """
        Calculates if Person 1 is actively throwing high-velocity strikes/punches toward Person 2.
        """
        id1 = p_agg["id"]
        hist1 = self.history[id1]
        if len(hist1) < 2:
            return False

        curr1 = hist1[-1]
        prev1 = hist1[-2]
        kp_curr = curr1.get("keypoints")
        kp_prev = prev1.get("keypoints")

        if kp_curr is None or kp_prev is None or len(kp_curr) < 17 or len(kp_prev) < 17:
            return False

        h1 = max(curr1["height"], 20.0)
        box2 = p_vic["box"]
        c2 = np.array([(box2[0] + box2[2]) / 2.0, (box2[1] + box2[3]) / 2.0])

        min_conf = getattr(config, "KEYPOINT_CONF", 0.30)
        thresh = getattr(config, "STRIKE_VELOCITY_THRESH", 30.0)

        for w_idx in [9, 10]:
            if kp_curr[w_idx][2] > min_conf and kp_prev[w_idx][2] > min_conf:
                p_prev = kp_prev[w_idx][:2]
                p_curr = kp_curr[w_idx][:2]

                speed = np.linalg.norm(p_curr - p_prev)
                norm_speed = (speed / h1) * 100.0

                if norm_speed > thresh:
                    # Verify wrist is moving TOWARDS the victim
                    d_prev_to_vic = np.linalg.norm(p_prev - c2)
                    d_curr_to_vic = np.linalg.norm(p_curr - c2)
                    if d_curr_to_vic < d_prev_to_vic and d_curr_to_vic < (h1 * 1.3):
                        return True

        return False

    def _check_fall(self, track_id):
        """Detects sudden vertical knockdown or horizontal posture."""
        hist = self.history[track_id]
        if len(hist) < 4:
            return False

        curr = hist[-1]
        # Aspect ratio: wide bounding box on floor
        if curr["width"] > (curr["height"] * 1.35) and curr["height"] < 120:
            return True

        # Sudden vertical center drop
        y_initial = hist[0]["center"][1]
        y_current = curr["center"][1]
        h = max(curr["height"], 20.0)

        if (y_current - y_initial) > (h * 0.65):
            return True

        return False

    @staticmethod
    def _boxes_intersect(b1, b2):
        """Returns True if two bounding boxes intersect/overlap."""
        x1 = max(b1[0], b2[0])
        y1 = max(b1[1], b2[1])
        x2 = min(b1[2], b2[2])
        y2 = min(b1[3], b2[3])
        return (x2 > x1) and (y2 > y1)

    def close(self):
        self.history.clear()
        self.choke_persistence.clear()
