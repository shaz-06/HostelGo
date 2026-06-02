const BORZO_API_URL = "https://robotapitest-in.borzodelivery.com/api/business/1.6";

/**
 * Creates an order on the Borzo Sandbox delivery system.
 * Throws or returns errors directly without silent mock fallback.
 * 
 * @param {Object} order - The MongoDB/Mongoose Order document
 * @returns {Promise<Object>} - Contains { success: true/false, borzoOrderId, trackingUrl, deliveryCost, rawResponse }
 */
async function createBorzoOrder(order) {
  const clientId = process.env.BORZO_CLIENT_ID;
  const apiToken = process.env.BORZO_API_TOKEN;

  // Retrieve pickup details from environment variables
  const pickupName = process.env.BORZO_PICKUP_NAME;
  const pickupAddress = process.env.BORZO_PICKUP_ADDRESS;
  const pickupPhone = process.env.BORZO_PICKUP_PHONE;

  const isTokenMock = !apiToken || apiToken === "mock_borzo_api_token_here" || apiToken.includes("[use token");

  let simulationReason = null;
  if (!clientId) {
    simulationReason = "BORZO_CLIENT_ID is missing in environment variables";
  } else if (!apiToken) {
    simulationReason = "BORZO_API_TOKEN is missing in environment variables";
  } else if (isTokenMock) {
    simulationReason = "Active BORZO_API_TOKEN is set to a mock/placeholder value";
  }

  if (simulationReason) {
    console.warn(`⚠️ [BORZO AUDIT] Simulation Mode Activated. Reason: ${simulationReason}`);
    return {
      success: false,
      isSimulation: true,
      error: `Simulation mode active: ${simulationReason}`
    };
  } else {
    console.log("✅ [BORZO AUDIT] Real API Mode Active (Simulation mode is disabled)");
  }

  // Construct payload for Borzo API v1.6
  const payload = {
    matter: "HostelGo Store Order Delivery",
    points: [
      {
        address: pickupAddress || "123, Tech Park Rd, Yelahanka, Bengaluru, Karnataka 560064",
        contact_person: {
          name: pickupName || "Buyto Store",
          phone: pickupPhone || "9876543210"
        }
      },
      {
        address: order.deliveryAddress || "Yelahanka, Bengaluru, Karnataka",
        contact_person: {
          name: order.user?.name || "Customer",
          phone: order.user?.phone || "0000000000"
        }
      }
    ]
  };

  // Attach coordinates if available
  if (order.deliveryLatitude && order.deliveryLongitude) {
    payload.points[1].latitude = order.deliveryLatitude;
    payload.points[1].longitude = order.deliveryLongitude;
  }

  // Handle Cash on Delivery (COD)
  if (order.paymentMethod?.toLowerCase() === "cod") {
    payload.points[1].taking_amount = String(order.totalAmount);
  }

  const url = `${BORZO_API_URL}/create-order`;
  const maskedToken = apiToken && apiToken.length > 8 
    ? `${apiToken.slice(0, 4)}...${apiToken.slice(-4)}` 
    : "Invalid";

  console.log("=== [BORZO AUDIT] Sending create-order request ===");
  console.log("API URL:", url);
  console.log("Request payload:", JSON.stringify(payload, null, 2));
  console.log("Headers being sent:", JSON.stringify({
    "Content-Type": "application/json",
    "X-DV-Auth-Token": maskedToken
  }, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DV-Auth-Token": apiToken
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log("=== [BORZO AUDIT] Received API Response ===");
    console.log("HTTP status:", response.status);
    console.log("Full Borzo response:", text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (parseErr) {
      console.error("❌ Failed to parse response JSON:", parseErr.message);
      return {
        success: false,
        error: `Incorrect endpoint/Invalid JSON: ${text}`
      };
    }

    if (!response.ok || !result.is_successful) {
      console.error("❌ [BORZO AUDIT] Order creation failed on API:");
      let failureReason = "Unknown API failure";
      
      if (response.status === 401) {
        failureReason = "Invalid token: The configured BORZO_API_TOKEN is unauthorized";
      } else if (response.status === 404) {
        failureReason = "Incorrect endpoint: The API endpoint URL is not found";
      } else if (result.errors?.includes("invalid_parameters")) {
        const paramErrors = result.parameter_errors;
        if (paramErrors && JSON.stringify(paramErrors).includes("taking_amount") && JSON.stringify(paramErrors).includes("not_allowed")) {
          failureReason = "Sandbox account restrictions: Cash on Delivery (taking_amount) is not allowed on this sandbox account without a COD agreement";
        } else {
          failureReason = `Invalid payload: Parameter errors - ${JSON.stringify(paramErrors)}`;
        }
      } else if (result.errors) {
        failureReason = `API error response: ${result.errors.join(", ")}`;
      }

      console.error(`Root Cause Identified: ${failureReason}`);

      return {
        success: false,
        error: failureReason,
        rawResponse: result
      };
    }

    const borzoOrderId = result.order?.order_id || result.order_id;
    const trackingUrl = result.order?.tracking_url || 
                        result.order?.points?.[1]?.tracking_url || 
                        result.order?.points?.[0]?.tracking_url || 
                        `https://borzodelivery.com/in/track/${borzoOrderId}`;

    const deliveryCost = Number(result.order?.delivery_fee_amount || result.delivery_fee_amount || 0);

    console.log("Parsed order ID:", borzoOrderId);
    console.log("Parsed tracking URL:", trackingUrl);

    return {
      success: true,
      borzoOrderId: String(borzoOrderId),
      trackingUrl,
      deliveryCost,
      rawResponse: result
    };
  } catch (error) {
    console.error("❌ [BORZO AUDIT] Exception inside createBorzoOrder:", error.message);
    return {
      success: false,
      error: `Network or runtime exception: ${error.message}`
    };
  }
}

module.exports = {
  createBorzoOrder
};
