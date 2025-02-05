declare global {
  interface Window {
    __analytics__: {
      serverUrl: string;
    };
  }
}

export const fetchPrincipalInfo = async (token: string) => {
    try {
      const response = await fetch(`${window.__analytics__.serverUrl}/access/principal/web`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      const text = await response.text();
      
      // Remove callback wrapper if present
      const jsonText = text.replace(/^somecallback\(/, "").replace(/\)$/, "");
      const data = JSON.parse(jsonText);
  
      if (data.status === "success") {
        return data;
      } else {
        throw new Error("Failed to fetch principal info");
      }
    } catch (error) {
      console.error("Error fetching principal info:", error);
      return null;
    }
  };
  