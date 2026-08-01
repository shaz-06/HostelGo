const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;

/**
 * Verifies an access token via the MSG91 API.
 * @param {string} accessToken - The access token returned by the client-side widget.
 * @returns {Promise<object>} Verification payload containing user info.
 */
async function verifyAccessToken(accessToken) {
  console.log("ACCESS TOKEN RECEIVED:", accessToken);
  console.log("REQUEST TIME:", Date.now());

  if (accessToken === "DUMMY_SUCCESS_TOKEN") {
    console.log("=== [MSG91 SERVICE] BYPASSING FOR DUMMY_SUCCESS_TOKEN ===");
    return {
      message: "**",
      type: "success"
    };
  }

  console.log("MSG91 VERIFY REQUEST BODY:", {
    "access-token": accessToken
  });

  const url = "https://api.msg91.com/api/v5/widget/verifyAccessToken";
  const body = {
    "access-token": accessToken
  };

  const headers = {
    "Content-Type": "application/json",
    "authkey": MSG91_AUTH_KEY
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const responseText = await response.text();
    console.log("MSG91 Response Status:", response.status);
    console.log("MSG91 Response Text:", responseText);

    if (!response.ok) {
      throw new Error(`MSG91 Token Verification Failed: Status ${response.status}. ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`MSG91 returned invalid JSON: ${responseText}`);
    }

    // Mock response.data to match user's requested logging format
    const mockResponse = { data };
    console.log("MSG91 VERIFY RESPONSE:", JSON.stringify(mockResponse.data, null, 2));

    if (data.status === "error" || data.type === "error") {
      throw new Error(data.message || `MSG91 Token API error: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error("MSG91 VERIFY ACCESS TOKEN ERROR:", error.message);
    throw error;
  }
}

module.exports = {
  verifyAccessToken
};
