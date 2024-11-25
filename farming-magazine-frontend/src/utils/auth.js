export const getAuthHeader = () => {
  const token = localStorage.getItem('myAppAdminToken'); // Use standardized key
  if (!token) throw new Error('Token not found. Please login as admin.');
  return { Authorization: `Bearer ${token}` };
};
