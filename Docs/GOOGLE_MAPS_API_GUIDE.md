# Google Maps API Key Guide for SmartEVP+

To render the live embedded turn-by-turn navigation map in the Ambulance Paramedic HUD, you need a Google Maps JavaScript API key.

## Step-by-Step Instructions

1. **Create a Google Cloud Project**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click the project drop-down in the top navigation bar and select **"New Project"**.
   - Name it "SmartEVP-Demo" and create it.

2. **Enable the Maps Embed API**
   - In the sidebar, navigate to **APIs & Services > Library**.
   - Search for **"Maps Embed API"**.
   - Click on it and hit the **"Enable"** button.

3. **Generate your API Key**
   - In the sidebar, navigate to **APIs & Services > Credentials**.
   - Click on **"+ CREATE CREDENTIALS"** at the top and select **"API key"**.
   - A modal will pop up displaying your new API key `AIzaSy...`. Copy this key.

4. **Add the Key to the Project Environment**
   - Open the `.env.local` file inside your `Frontend/` folder.
   - Add the key like this:
     ```env
     NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...your_copied_key_here...
     ```

5. **Restart the Next.js Server**
   - Stop your frontend server (`Ctrl+C` in the terminal).
   - Start it again using `npm run dev`.

The Ambulance HUD will now automatically render the live embedded iframe with the directions!

> **Note**: For a simple demonstration, billing is usually not required for development, but Google may ask you to link a billing account if you exceed the free tier. The free tier quota for the Embed API is generous and essentially limitless for this demo case.
