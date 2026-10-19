let socketInstance = null;
let initPromise = null;

export const initSocket = async () => {
  if (socketInstance) return socketInstance;
  
  if (!initPromise) {
    initPromise = import("socket.io-client").then(({ io }) => {
      socketInstance = io(window.API_BASE_URL, {
        auth: {
          token: localStorage.getItem("token")
        }
      });
      return socketInstance;
    });
  }
  
  return initPromise;
};

export const getSocket = () => socketInstance;
