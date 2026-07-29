# SHEAR-ATMOS

## One-click desktop-style app

Double-click **`INSTALL SHEAR-ATMOS V5.cmd`** once. It creates a **SHEAR-ATMOS V5** shortcut directly on your Desktop and opens the app. After that, use the desktop icon. The same five steps are also in `START HERE - SHEAR-ATMOS V5.txt`.

`Launch SHEAR-ATMOS.vbs` remains available if you prefer to start it from this folder; it launches the local app in a separate Microsoft Edge app window, with no command prompt left on screen.

No command-line setup is required. Double-click the launcher (or the desktop shortcut after installing it) and it starts the app's private local service automatically at `http://localhost:8780`; this lets browser geolocation work reliably. The included launcher finds the local Node.js runtime already installed on this computer. Once open, click **Install app** in the top-right to let Edge install it as a real standalone PWA. Browser security requires that one confirmation; a web page cannot silently install itself.

Use the provided launcher or desktop shortcut, then choose **Use my location** followed by **Autofill thermos**. Opening `index.html` directly is not recommended because browsers can block location access from a file.

## What's included

- **Environment**: manual or model-filled thermodynamic ingredient analysis.
- **Environmental-support screen**: a 0-100 conditional support screen weights modeled buoyancy, moisture, inhibition, column moisture, and height-aware wind proxies. It is not a probability forecast; the advice names missing factors such as boundaries, forcing, observed soundings, lapse rates, and storm mode.
- **7-day forecast**: selectable daily weather cards with weather icons and linked hourly profile data.
- **Historical analogue**: compare a chosen past date or search the previous five years for the closest available matching-hour thermodynamic profile. It is an ingredient-only comparison, not a storm-report database or a forecast.
- **Live radar**: a pan-and-zoom map for the nearest NEXRAD station with selectable base reflectivity, base radial velocity, and hydrometeor-classification products.
- **Radar reliability**: the radar initializes only after its tab is visible, reports whether a live image loaded, and has a manual **Refresh radar** button plus an official NWS-radar fallback link.
- **Research source**: CSU-MLP opens directly in a new browser tab because the provider blocks reliable in-app embedding.
- **Location and time**: the NWS point lookup supplies the nearest city/state and local time zone. The header shows current NWS Z time plus daylight-saving or standard-time status.
- **Live warnings**: a scrolling local-alert ribbon and a nationwide NWS active-alert polygon map refresh every five minutes while the app is running. Use **Zoom to my area** to focus the map near the selected location.
- **Refresh schedule**: loaded model guidance automatically refreshes at the next 00Z or 12Z cycle while the app is open.

The app fetches numerical-model forecast fields from Open-Meteo and, in the United States, checks active NWS alerts for the selected coordinate. It opens CSU-MLP and SPC guidance as live external sources rather than embedding fragile image URLs.

This is situational-awareness software, not an official forecast or warning product. Use NWS alerts and local emergency instructions for safety decisions.
