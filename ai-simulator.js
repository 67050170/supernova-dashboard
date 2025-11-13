import axios from 'axios';

// --- 1. ตั้งค่าการทดสอบ ---

// Token ที่ต้องตรงกับ .env ของ Server
const SECRET_TOKEN = '8af2ad37-da96-455e-880f-1778bfd6658d'; // ⚠️ ใส่ Token จริงของคุณที่นี่

// ID ของกล้องที่จะส่งข้อมูลไป
const CAMERA_ID_TO_TEST = 'a93479da-d106-481d-941c-dc1184fa69cc'; // ⚠️ ตรวจสอบว่า ID นี้ถูกต้อง

// ID ของโดรน
const DRONE_ID = 'drone-sim-001';

// ที่อยู่ของ Server
const API_URL = 'http://localhost:3001/api/ai-data';

// --- 2. กำหนดเส้นทางการบิน (จำลอง) ---
// นี่คือ Array ของพิกัดที่เราจะส่งไปทีละจุด
const flightPath = [
  { lat: 13.7563, lng: 100.5018, height: 100 },
  { lat: 13.7565, lng: 100.5020, height: 105 },
  { lat: 13.7567, lng: 100.5022, height: 110 },
  { lat: 13.7569, lng: 100.5024, height: 115 },
  { lat: 13.7571, lng: 100.5026, height: 120 },
  { lat: 13.7573, lng: 100.5028, height: 115 },
  { lat: 13.7575, lng: 100.5030, height: 110 },
];

// ฟังก์ชันหน่วงเวลา (msec)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 3. ฟังก์ชันหลักสำหรับเริ่มยิง API ---
async function startSimulation() {
  console.log(`🚀 เริ่มการจำลอง AI... ยิงไปที่กล้อง: ${CAMERA_ID_TO_TEST}`);
  console.log(`  simulating ${flightPath.length} updates...`);

  // วนลูปตามเส้นทางการบิน
  for (const point of flightPath) {
    // สร้าง Payload ที่ Server คาดหวัง
    const payload = {
      camera_id: CAMERA_ID_TO_TEST,
      other_data: {
        id: DRONE_ID,
        lat: point.lat,
        lng: point.lng,
        height: point.height,
        amplitude: Math.random() * 10, // สุ่มค่า amplitude เล่น
        imageUrl: '/medium.png' // ใช้รูปภาพเริ่มต้น
      }
    };

    try {
      // ยิง POST Request
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Authorization': `Bearer ${SECRET_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ ส่งพิกัด: [${point.lat}, ${point.lng}] -> Server ตอบ: ${response.data.message}`);

    } catch (error) {
      console.error(`❌ เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }

    // หน่วงเวลา 1 วินาที (1000ms) ก่อนส่งพิกัดถัดไป
    // (ปรับค่านี้น้อยลง เช่น 200ms เพื่อให้โดรนขยับเร็วขึ้น)
    await sleep(1000);
  }

  console.log('🏁 การจำลองสิ้นสุด');
}

// เริ่มการจำลอง
startSimulation();