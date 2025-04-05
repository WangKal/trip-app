//Best
import React, { forwardRef, useEffect, useRef, useState } from "react";


const LogCanvas = forwardRef(({ logEntries, tripDetails, logDetails }, ref) => {
 
  const canvasRef = useRef(null);
  const [fromAddress, setFromAddress] = useState("Fetching address...");
  const [toAddress, setToAddress] = useState("Fetching address...");
  const [loading, setLoading] = useState(true);

  // Function to fetch address from GPS
  const fetchAddress = async (gpsString, setAddress) => {
    if (!gpsString) {
      setAddress("No GPS data");
      return;
    }

    // Extract latitude and longitude from the string
    const match = gpsString.match(/([-+]?\d*\.\d+),\s*([-+]?\d*\.\d+)/);//match(/GPS:\s*([-+]?[0-9]*\.?[0-9]+),\s*([-+]?[0-9]*\.?[0-9]+)/);
    if (!match) {
      setAddress("Invalid GPS format");
      return;
    }

    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();

      // Extract meaningful address parts
      const { road, town, city, village, state } = data.address;
      let shortAddress = road || town || city || village || state || "Unknown Location";

      setAddress(shortAddress);
      //setAddress(data.display_name || "Address not found");
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress("Error fetching address");
    }
  };
  // Fetch addresses when tripDetails change
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAddress(tripDetails?.from_location, setFromAddress),
      fetchAddress(tripDetails?.to_location, setToAddress),
    ]).then(() => setLoading(false)); // Set loading to false once all fetches complete
}, [tripDetails]);
  //const logEntries = generateRandomLogs(10);

  useEffect(() => {
    if (loading) return; // Don't render if loading

    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    // Reset and force redraw background
    ctx.save(); // Save current state
    ctx.globalCompositeOperation = "destination-over"; // Ensures background applies first
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1200, 900);
    ctx.restore(); // Restore saved state
    // Helper to extract time (HH:MM) from ISO 8601 format
    const parseTime = (isoString) => {
      try {
        const date = new Date(isoString);
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      } catch (error) {
        console.error("Invalid date format:", isoString);
        return "00:00";
      }
    };
    const trip_date = (tripDetails?.date).split('-')
const month = trip_date[1];
const day = trip_date[2];
const year = trip_date[0];

    // Helper to map time to X-coordinate
    const timeToX = (time) => {
      if (!time || typeof time !== "string" || !time.includes(":")) {
        return gridLeft;
      }
      const [hours, minutes] = time.split(":").map(Number);
      return gridLeft + ((hours + minutes / 60) / 24) * gridWidth;
    };

    // Helper to draw text with optional bold style
    const drawText = (text, x, y, bold = false, wrapWidth = 100, fontSize = 12) => {
      ctx.font = `${bold ? "bold" : "normal"} ${fontSize}px Arial`;
       const lines = text.split("\n");
      ctx.fillText(text, x, y);
    };

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Section Titles
    drawText("Driver's Daily Log", 20, 40, true);
    drawText("(24 hours)", 20, 60);
    drawText("Original: File at home terminal.", 750, 40);
    drawText("Duplicate: Driver retains for 8 days.", 750, 60);

    // Date Fields
    drawText(`Month: ${month}`, 250, 40);
    drawText(`/Day: ${day}`, 350, 40);
    drawText(`/Year: ${year}`, 450, 40);


    // From and To Section
    drawText(`From: `, 20, 100);
    drawText(`${fromAddress}`, 90, 100,false,400);
    ctx.strokeRect( 80, 80, 300, 30);
    drawText(`To:`, 400, 100);
    drawText(`${toAddress}`, 450, 100,false,400);
    ctx.strokeRect(440, 80, 300, 30);

    // Mileage and Carrier Info
    drawText(`Total Miles Driving Today`, 20, 160, false, 200);
    drawText(`${logDetails?.total_miles_driving_today}`, 30, 190, false, 400);
    
    ctx.strokeRect(20, 170, 200, 30);
    drawText(`Total Mileage Today  `, 250, 160, false, 200);
     drawText(`${logDetails?.total_miles_today}`, 260, 190, false, 400);
    
    ctx.strokeRect(250, 170, 200, 30);
    drawText(`Name of Carrier or Carriers ${tripDetails?.carrier_name}`, 500, 160, false, 200);
    drawText(`${tripDetails?.carrier_name}`, 510, 190, false, 400);
    
    ctx.strokeRect(500, 170, 400, 30);

    // Truck and Address
    drawText(`Truck/Tractor and Trailer Numbers `, 20, 220, false, 200);
    drawText(` ${tripDetails?.truck_number}/${tripDetails?.trailer_number}`, 30, 250, false, 200);
    
    ctx.strokeRect(20, 230, 400, 30);
    drawText(`Home Terminal Address  ${tripDetails?.home_terminal_address}`, 500, 220, false, 200);
drawText(`${tripDetails?.home_terminal_address}`, 510, 250, false, 200);
    
    ctx.strokeRect(500, 230, 400, 30);

    // Time Grid Header
    const gridLeft = 70;
    const gridTop = 330;
    const gridWidth = 850;
    const gridHeight = 200;
    const columnWidth = gridWidth / 24;
    const rowHeight = gridHeight / 4;
    const subColumnWidth = columnWidth / 4;

    // Draw time grid
    for (let i = 0; i <= 24; i++) {
      const x = gridLeft + i * columnWidth;
      const timeLabel = i > 12 ? i - 12 : i;
      drawText(timeLabel.toString(), x, 300);

      ctx.beginPath();
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridTop + gridHeight);
      ctx.stroke();

      if (i < 24) {
        for (let j = 0; j < 4; j++) {
          const rowY = gridTop + j * rowHeight;
          for (let k = 1; k <= 3; k++) {
            const subX = x + k * subColumnWidth;
            const indicatorHeight = k === 2 ? 15 : 10;
            const indicatorY = rowY - 1;

            ctx.beginPath();
            ctx.moveTo(subX, indicatorY);
            ctx.lineTo(subX, indicatorY + indicatorHeight);
            ctx.stroke();
          }
        }
      }
    }
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      const words = text.split(" ");
      let line = "";
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line, x, y);
          line = words[i] + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
    };
const drawWrappedText = (text, x, y, maxWidth, lineHeight) => {
      const lines = text.split("\n");
      lines.forEach((line) => {
        wrapText(line, x, y, maxWidth, lineHeight);
        y += lineHeight;
      });
    };
    // Activity Labels
    const activities = ["1. Off Duty", "2. Sleeper \n Berth", "3. Driving", "4. On Duty\n (not driving)"];
    activities.forEach((activity, index) => {
      drawWrappedText(activity, 10, 350 + index * 50,100, 20);
      ctx.strokeRect(gridLeft, gridTop + index * 50, gridWidth, 50);
     
    });
    drawWrappedText("Total \n Hours", 950, 300, 100,20);
    drawWrappedText(`${logDetails.total_off_duty_hours}`, 950, 360, 100,20);
    drawWrappedText(`${logDetails.total_sleeper_hours}`, 950, 410, 100,20);
    drawWrappedText(`${logDetails.total_driving_hours}`, 950, 460, 100,20);
    drawWrappedText(`${logDetails.total_on_duty_hours}`, 950, 510, 100,20);
    

    // Map status to Y-axis position
    const statusToY = {
      "off": gridTop,
      "sleeper": gridTop + rowHeight,
      "driving": gridTop + 2 * rowHeight,
      "on": gridTop + 3 * rowHeight,
    };

    // Draw Log Entries
    let previousEntry = null;
    logEntries.forEach((entry) => {
            const formatTime = (isoString) => {
  if (!isoString) return "0:00"; // Handle missing timestamps

  // Ensure the ISO string is valid
  const date = new Date(isoString.trim());
 
  if (isNaN(date.getTime())) {
    console.error("Invalid date format:", isoString);
    return "0:00"; // Return default to prevent NaN
  }

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0"); // Two-digit minutes
  return `${hours}:${minutes}`;
};


      const { status, start_time, end_time, automated } = entry;
      const y = statusToY[status.toLowerCase()] || gridTop;
      const x1 = timeToX(formatTime(start_time)); // Convert to "6:00" format
       
      const x2 = timeToX(formatTime(end_time)); 

  // Draw the main log line
  ctx.beginPath();
  ctx.moveTo(x1, y + 25);
  ctx.lineTo(x2, y + 25);
  ctx.strokeStyle = status === "driving" ? "red" : "black";
  ctx.lineWidth = 3;
  ctx.stroke();

  
  // Adjust the vertical transition lines
  if (previousEntry === null) {
    // First entry, start from the baseline
    const yPrev = gridTop; // Start from the baseline for the first entry

    // Draw the initial vertical line from the baseline to the first entry's start
    ctx.beginPath();
    ctx.moveTo(x1, yPrev); // Start from baseline
    ctx.lineTo(x1, y + 25); // Draw vertical line to the first entry's start
    ctx.stroke();

    // Optional: Draw a transition from the first log entry's end to the next entry's start
    ctx.beginPath();
    ctx.moveTo(x2, y + 25); // Connect from the first entry's end
    ctx.lineTo(x2, yPrev + 75); // Adjust the vertical length for the next entry
    ctx.stroke();

  } else {
    // For subsequent entries, calculate the position of the vertical line dynamically
    const yPrev = statusToY[previousEntry.status] + 25; // Position of the previous entry

    // Draw vertical line connecting from the previous entry's end to the current entry's start
    ctx.beginPath();
    ctx.moveTo(x1, yPrev); // Connect from the previous entry's end
    ctx.lineTo(x1, y + 25); // Draw to the current entry's start
    ctx.stroke();

    // Optional: Add a vertical line at the end to the next entry
    ctx.beginPath();
    ctx.moveTo(x2, yPrev); // Connect from the previous entry's end
    ctx.lineTo(x2, y + 25); // Draw to the current entry's start
    ctx.stroke();
  }


    // Draw remarks section
    const drawRemarksSection = () => {
     
           const startY = 400;
      const remarksStartY = startY + 150;
      drawText("Remarks", 40, remarksStartY, true, 860, 14);
      drawWrappedText(`${logDetails?.remarks}`, 40, remarksStartY+30, 900, 18);
      drawText("Shipping Documents:", 40, remarksStartY + 150, true, 860, 12);
      drawText(`${tripDetails?.shipper}`, 40, remarksStartY + 185, true, 860, 12);
      drawText("DVIR or Manifest No.", 40, remarksStartY + 200, false, 860, 12);
      drawText(`${tripDetails?.document_no}`, 40, remarksStartY + 215, true, 860, 12);
      drawText("or", 40, remarksStartY + 225, false, 860, 12);
      drawText(`${tripDetails?.commodity}`, 40, remarksStartY + 245, true, 860, 12);
      drawText("Shipper & Commodity", 40, remarksStartY + 255, false, 860, 12);
       ctx.beginPath();
  ctx.moveTo(20, 860);
  ctx.lineTo(20, 550);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, 860);
  ctx.lineTo(300, 860);
  ctx.stroke();

  ctx.moveTo(550, 860);
  ctx.lineTo(900, 860);
  ctx.stroke();
    };

    drawRemarksSection();
   
    // Instructional Text
    drawWrappedText(
      "Enter name of place you reported and where released from work and where each change of duty occurred.",
      175,
      850 ,
      800,
      20
    );
 // Instructional Text
    drawWrappedText(
      "Use time standard of home terminal.",
      325,
      860 ,
      800,
      20
    );
        // Draw recap section
    const recapLabels = [
      "Recap: Complete at end of day",
      `${logDetails?.total_on_duty_hours_today}\nOn duty hours today (Lines 3 & 4)`,
      "70 Hour / 8 Day Drivers",
      `A. ${logDetails?.total_on_duty_hours_last_7_days}\n Total hours on duty last 7 days including today.`,
      `B. ${logDetails?.available_hours_tomorrow}\n Total hours available tomorrow.`,
      `C. ${logDetails?.total_on_duty_hours_last_8_days}\nTotal hours on duty last 8 days including today.`,
      "60 Hour / 7 Day Drivers",
      `A. ${logDetails?.total_on_duty_hours_last_6_days}\nTotal hours on duty last 6 days including today.`,
      `B. ${logDetails?.available_hours_tomorrow}\nTotal hours available tomorrow.`,
      `C. ${logDetails?.total_on_duty_hours_last_7_days}\nTotal hours on duty last 7 days including today.`,
      "If you took 34 consecutive hours off duty,you have 60/70 hours available).",
    ];

    const recapSectionWidth = 860;
    const recapColumnWidth = recapSectionWidth / recapLabels.length;
    const startXr = 40;
    const startYr = 900;

    recapLabels.forEach((label, index) => {
      const xPos = startXr + index * recapColumnWidth;
      drawWrappedText(label, xPos, startYr, recapColumnWidth - 10, 20);
    });

      previousEntry = entry;
    });
 // Forward ref to canvasRef
    if (ref) {
      if (typeof ref === "function") {
        ref(canvasRef.current);
      } else {
        ref.current = canvasRef.current;
      }
    }
  }, [loading,logEntries,tripDetails]);

  return (
    <div>
      <h1>Driver's Daily Log (Canvas)</h1>
      <canvas ref={canvasRef} width={1000} height={1200} style={{ border: "1px solid #000" }} />
    </div>
  );
})

export { LogCanvas };
