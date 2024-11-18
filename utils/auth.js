// utils/auth.js
export async function loginUser(username, password) {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const hardcodedUsername = "satish";
    const hardcodedPassword = "satish@123";

    if (username === hardcodedUsername && password === hardcodedPassword) {
      const token = "fakeToken123";
      return { 
        success: true, 
        token,
        message: "Login successful" 
      };
    } else {
      return { 
        success: false, 
        message: "Invalid username or password" 
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed" };
  }
}

// Utility function to log out and clear token
export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}
