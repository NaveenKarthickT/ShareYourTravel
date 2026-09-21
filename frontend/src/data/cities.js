// Curated list of cities, towns and popular areas.
export const CITIES = [
  "Bangalore", "Bengaluru", "Mumbai", "Delhi", "New Delhi", "Chennai",
  "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Surat", "Jaipur",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana",
  "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi",
  "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Allahabad",
  "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior",
  "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota",
  "Chandigarh", "Guwahati", "Solapur", "Hubli", "Mysore",
  "Tiruchirappalli", "Bareilly", "Aligarh", "Tiruppur",
  "Moradabad", "Jalandhar", "Bhubaneswar", "Salem",
  "Warangal", "Guntur", "Bhiwandi", "Saharanpur",
  "Gorakhpur", "Bikaner", "Amravati", "Noida", "Jamshedpur",
  "Bhilai", "Cuttack", "Firozabad", "Kochi", "Nellore",
  "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela",
  "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga",
  "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi",
  "Ulhasnagar", "Jammu", "Sangli", "Miraj", "Vellore",
  "Belgaum", "Mangalore", "Tirunelveli", "Malegaon", "Gaya",
  "Udaipur", "Maheshtala", "Davanagere", "Kozhikode",
  "Kurnool", "Rajpur Sonarpur", "Rajahmundry", "Bokaro",
  "South Dumdum", "Bellary", "Patiala", "Gopalpur", "Agartala",
  "Bhagalpur", "Muzaffarnagar", "Bhatpara", "Panihati",
  "Latur", "Dhule", "Rohtak", "Sagar", "Korba", "Bhilwara",
  "Berhampur", "Muzaffarpur", "Ahmednagar", "Mathura",
  "Kollam", "Avadi", "Kadapa", "Kamarhati", "Sambalpur",
  "Bilaspur", "Shahjahanpur", "Satara", "Bijapur",
  "Kakinada", "Nizamabad", "Shivamogga", "Ratlam",
  "Modinagar", "Durg", "Shillong", "Imphal", "Aizawl",
  "Kohima", "Itanagar", "Gangtok", "Panaji", "Pondicherry",
  "Port Blair", "Kavaratti",

  "Whitefield", "Electronic City", "Koramangala", "Indiranagar",
  "Jayanagar", "HSR Layout", "Marathahalli", "Yelahanka",
  "Hebbal", "Banashankari", "Rajajinagar", "BTM Layout",
  "Sarjapur Road", "Bellandur", "Kadugodi", "Devanahalli",
  "Bommanahalli", "Peenya", "Yeshwanthpur",
  "Tambaram", "OMR", "Guindy", "Velachery", "Adyar", "T Nagar",
  "Anna Nagar", "Porur", "Perungudi", "Ambattur",
  "Chromepet", "Pallavaram", "Thiruvanmiyur", "Besant Nagar",
  "Egmore", "Nungambakkam", "Mylapore", "Triplicane",
  "Madhavaram", "Poonamallee", "Pallikaranai", "Sholinganallur",
  "Siruseri", "Kelambakkam", "Mahindra World City",

  "Andheri", "Bandra", "Powai", "Navi Mumbai", "Thane West",
  "Borivali", "Kandivali", "Malad", "Goregaon", "Chembur",
  "Lower Parel", "Worli", "Colaba", "Dadar",
  "Gurgaon", "Gurugram", "Greater Noida",
  "Saket", "Dwarka", "Rohini", "Karol Bagh", "Connaught Place",
  "Nehru Place", "Hauz Khas", "Vasant Kunj",
  "Hinjewadi", "Kharadi", "Baner", "Aundh", "Wakad",
  "Magarpatta", "Hadapsar", "Viman Nagar", "Pimpri", "Chinchwad",
  "Hitec City", "Gachibowli", "Madhapur", "Kondapur",
  "Banjara Hills", "Jubilee Hills", "Secunderabad",
  "Salt Lake", "New Town", "Rajarhat", "Park Street",
  "Sector V", "Bidhannagar", "Behala", "Garia",

  "San Francisco", "New York", "Los Angeles", "Seattle",
  "Austin", "Boston", "Chicago", "Denver", "Miami",
  "London", "Manchester", "Birmingham", "Edinburgh",
  "Dublin", "Amsterdam", "Berlin", "Munich", "Paris",
  "Barcelona", "Madrid", "Rome", "Milan",
  "Dubai", "Abu Dhabi", "Singapore", "Hong Kong",
  "Tokyo", "Osaka", "Seoul", "Sydney", "Melbourne",
  "Toronto", "Vancouver", "Mexico City",
];

const normalize = (s) => (s || "").toLowerCase().trim();

export const searchCities = (query, limit = 8) => {
  const q = normalize(query);
  if (!q || q.length < 2) return [];
  const prefixMatches = [];
  const substringMatches = [];
  for (const city of CITIES) {
    const c = normalize(city);
    if (c.startsWith(q)) prefixMatches.push(city);
    else if (c.includes(q)) substringMatches.push(city);
  }
  return [...prefixMatches, ...substringMatches].slice(0, limit);
};
