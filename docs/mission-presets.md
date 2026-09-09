# Mission presets

Select these presets in the Mission dropdown of the drone configuration. They use
the existing dynamic mission loader and accept `Mission: {"name": "...", "param": []}`.
All positions are local meters relative to the drone's AirSim home. Set home to
the scene's intended origin (0, 0, 0 for the river mission) and initial yaw to 0°.
In geographic scenes, the configured geographic home defines that local origin.
Positive heights in these descriptions become negative AirSim NED Z values.

| Mission name | Sequence |
| --- | --- |
| `river_search_and_rescue` | Climb to (0, 0, 60); turn body 90° counterclockwise; move to (0, -362, 60); point camera 90° down; turn another 10° counterclockwise; slow from 4 to 2 m/s and move to (276, -362, 60). |
| `active_shooter_surveillance` | Camera starts at horizon; climb to (0, 0, 100); move to (-140, 0, 100) maintaining initial body heading; point camera 45° down; hover for 30 seconds. |
| `missing_person_search_and_rescue` | Climb to (0, 0, 100); move to (100, 600, 100); point camera 90° down; fly one 5 m radius revolution at 2 m/s and end at (100, 600, 100). |

Transit and climb speed defaults to 4 m/s. The circle center is (105, 600), so
the arrival point is on the perimeter, with no extra positioning leg. The circle
uses 72 segments with 1 m path lookahead. Actual flight accuracy depends on the
simulator's controller. Body heading is held during translation, including the
river legs after each turn. Camera pitch changes apply to camera `0` by default.

All three presets hover at completion and save the usual mission report. They
record the selected camera at 5 fps from before flight starts until mission exit,
including cancellation or failure. The MP4 is uploaded beside the mission log as
`<batch>/<MissionClass>/<MissionClass>_<drone>_recording.mp4` in report storage.
Recording errors appear in the mission log. If upload fails, the temporary local
MP4 is retained and its path is logged for recovery.
They
do not land or return home. Reset uses the existing task manager cancellation
and AirSim reset flow, interrupting the observation wait and preventing later steps.
Optional positional parameters are `[speed, camera_name]`; the river search leg
uses half of the chosen transit speed. Defaults require no parameters.
