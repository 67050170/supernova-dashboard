// server.js

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path'; // 1. Import path
import { fileURLToPath } from 'url'; // 2. Import url helpers
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// --- Express & Socket.IO Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity
  }
});
app.use(cors());
app.use(express.json());

// --- Static File Serving Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve the built frontend files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// 3. อ่านค่า Secret Token จาก environment variable
const SECRET_TOKEN_AI = process.env.SECRET_TOKEN_AI;

// ข้อมูลผู้ใช้สำหรับล็อกอิน (ย้ายมาจาก Frontend)
const USERS = {
  '9d7d4113-7a56-4298-8fb2-c71c4bcc0187': {
    token: 'ff8b6d81-bbf6-40b2-90de-5e392d77e348',
    dashboard: 'offence' // offence dashboard
  },
  'a93479da-d106-481d-941c-dc1184fa69cc': {
    token: '8af2ad37-da96-455e-880f-1778bfd6658d',
    dashboard: 'defence' // defence dashboard
  }
};

// --- API Routes ---
// ✅ API สำหรับให้เพื่อนยิงข้อมูลเข้ามา โดยใช้ cameraId + token เดิมเหมือนตอน Login
app.post('/api/friend-report', (req, res) => {
  const { camera_id, token, other_data } = req.body;

  // 1) เช็คว่ามี camera_id, token, other_data มั้ย
  if (!camera_id || !token || !other_data) {
    return res.status(400).json({ message: 'ต้องการ camera_id, token และ other_data' });
  }

  // 2) เช็คสิทธิ์จาก USERS (ใช้ token เดียวกับตอน login)
  const user = USERS[camera_id];
  if (!user || user.token !== token) {
    return res.status(403).json({ message: 'Camera ID หรือ Token ไม่ถูกต้อง' });
  }

  // 3) ดึงข้อมูล object (เป้าหมาย/โดรน) จาก other_data
  const { id, lat, lng, height, size, imageUrl, ...restOfData } = other_data;

  if (id === undefined || lat === undefined || lng === undefined) {
    return res.status(400).json({ message: 'other_data ต้องมี id, lat และ lng' });
  }

  // 4) ถ้าไม่มี imageUrl ให้เดาจาก size
  const finalImageUrl = imageUrl || `/${size || 'default'}.png`;

  // 5) payload ที่ frontend (Defence / AnotherDashboard) ใช้ได้ทันที
  const payload = {
    id,
    lat,
    lng,
    height,
    alt: height,               // ให้ alt = ความสูงเดียวกัน
    size,
    imageUrl: finalImageUrl,
    ...restOfData,
    camera_id,
    timestamp: new Date(),
  };

  // 6) ส่งเข้า room ตาม camera_id (เหมือน /api/ai-data)
  io.to(camera_id).emit('object_detection', payload);

  console.log(`📩 Friend report from camera ${camera_id}:`, payload);

  return res.status(200).json({ message: 'Report received' });
});


// Route สำหรับรับข้อมูลจาก AI
// New endpoint to receive drone reports via POST
app.post('/api/report', (req, res) => {
  const { camera_id, other_data } = req.body;

  // เช็คว่ามี camera_id และ other_data.id มั้ย
  if (!camera_id || !other_data || !other_data.id) {
    return res.status(400).json({ message: 'Missing camera_id or other_data' });
  }

  console.log(`Received API report for camera ${camera_id}:`, other_data);

  // ดึงค่าที่ต้องใช้จาก other_data
  const { id, lat, lng, height, size, imageUrl, ...restOfData } = other_data;

  if (id === undefined || lat === undefined || lng === undefined) {
    return res.status(400).json({ message: 'ข้อมูล other_data ไม่ครบถ้วน, ต้องการ id, lat, และ lng' });
  }

  // ถ้าไม่มี imageUrl ให้ใช้ตาม size
  const finalImageUrl = imageUrl || `/${size || 'default'}.png`;

  // ทำ payload ให้เหมือนกับที่ frontend คาดหวัง
  const payload = {
    id,
    lat,
    lng,
    height,
    alt: height,   // 👈 ให้ฟิลด์ alt ใช้ความสูงเดียวกับ height
    size,
    imageUrl: finalImageUrl,
    ...restOfData,
    camera_id,
    timestamp: new Date(),
  };

  // ส่งไปที่ห้อง camera_id เดียวกับ subscribe_camera
  io.to(camera_id).emit('object_detection', payload);

  res.status(200).json({ message: 'Report received' });
});


    // Destructure drone data for clarity and validation
    const { id, lat, lng, height, size, imageUrl, ...restOfData } = other_data;

    if (id === undefined || lat === undefined || lng === undefined) {
      console.warn('ได้รับข้อมูล AI ที่ไม่มี id, lat, หรือ lng:', other_data);
      return res.status(400).json({ message: 'ข้อมูล other_data ไม่ครบถ้วน, ต้องการ id, lat, และ lng' });
    }

    console.log('ได้รับข้อมูลจาก AI:');
    console.log(`  Camera ID: ${camera_id}`);
    console.log(`  Object ID: ${id}, Lat: ${lat}, Lng: ${lng}, Height: ${height}`);

    // Broadcast a well-structured object to the specific camera room
    // สร้าง imageUrl สำรองถ้าไม่มีการส่งมา
    const finalImageUrl = imageUrl || `/${size || 'default'}.png`;
    const payload = { id, lat, lng, height, size, imageUrl: finalImageUrl, ...restOfData, camera_id, timestamp: new Date() };
    io.to(camera_id).emit('object_detection', payload);

    res.status(200).json({ message: 'ได้รับข้อมูลเรียบร้อย' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการประมวลผลข้อมูล:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายใน Server' });
  }
});

// Route สำหรับตรวจสอบการล็อกอิน
app.post('/api/login', (req, res) => {
  const { cameraId, token } = req.body;

  if (!cameraId || !token) {
    return res.status(400).json({ message: 'กรุณากรอก Camera ID และ Token' });
  }

  const user = USERS[cameraId];
  if (user && user.token === token) {
    // Login สำเร็จ: ส่งประเภทของ dashboard กลับไป
    res.status(200).json({ message: 'Login สำเร็จ', dashboard: user.dashboard });
  } else {
    // Login ไม่สำเร็จ
    res.status(401).json({ message: 'Camera ID หรือ Token ไม่ถูกต้อง' });
  }
});

// New endpoint to receive drone reports via POST
app.post('/api/report', (req, res) => {
  const { camera_id, other_data } = req.body;

  if (!camera_id || !other_data || !other_data.id) {
    return res.status(400).json({ message: 'Missing camera_id or other_data' });
  }

  console.log(`Received API report for camera ${camera_id}:`, other_data);

  // Broadcast the data to clients subscribed to this camera_id
  // The room name is the camera_id
  io.to(camera_id).emit('object_detection', {
    camera_id,
    other_data,
  });

  res.status(200).json({ message: 'Report received' });
});

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
  console.log('🔌 A client connected to Socket.IO');

  // Handle camera subscription
  socket.on('subscribe_camera', (data) => {
    if (data && data.cam_id) {
      console.log(`📡 Client subscribed to camera: ${data.cam_id}`);
      socket.join(data.cam_id); // Join a room based on camera ID
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 A client disconnected');
  });
});

// --- Catch-all route to serve index.html for client-side routing ---
app.get(/^(?!\/api).*/, (req, res) => {
  // For any request that doesn't match an API route, send the main HTML file.
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Server Start ---

// 6. Start the server using the http instance
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server กำลังทำงานอยู่ที่ http://localhost:${PORT}`);
});
