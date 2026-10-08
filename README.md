# Human–AI Cultural Heritage Assessment · v10

## เริ่มทดลองใน HTML เดียว
1. เปิด `index.html` ใน Chrome หรือ Edge (ไฟล์เดียวมี CSS, JavaScript, Thai font, ตัวอย่างโมเดล และ worker ฝังไว้แล้ว)
2. Home: เลือก Nara, UNESCO, Burra หรือกรอบอื่นได้หลายรายการ และตั้งชื่อโครงการ
3. Workspace: กด **Load Pomposa example** หรือ **Open 3D JSON**
4. กด **Analyze model in browser** เพื่อคำนวณจริงบนอุปกรณ์ ไม่ต้องเปิด Colab
5. Results: ดูขนาด จำนวนจุด ระยะห่างจุด roughness และตำแหน่งที่ควรตรวจเพิ่ม
6. Criteria: บันทึกข้ออ้าง เหตุผล ผู้ประเมิน และหลักฐานที่เชื่อมกับ Nara/UNESCO ฯลฯ
7. Human Review: บันทึกผู้ทบทวน ข้อกังวล และแผนติดตาม
8. ใช้ **Save Workspace** หรือ **Export Project JSON** เก็บงาน และ **Generate Full Report / PDF** เพื่อพิมพ์รายงาน

## ข้อมูลสถานที่ก่อนประเมินคุณค่า
หน้า Criteria มีแบบฟอร์มข้อมูลทั่วไปของสถานที่ เช่น ชื่อท้องถิ่น ประเภท ที่ตั้ง ช่วงเวลา การใช้ประโยชน์ ประวัติ สภาพปัจจุบัน ความหมายต่อชุมชน คุณค่าที่เสนอ และแหล่งข้อมูล ช่องเหล่านี้เริ่มว่างและมีตัวอย่างคำอธิบาย ไม่เติมข้อเท็จจริงของสถานที่ให้เอง ข้อมูลบันทึกอยู่ใน `siteProfile` ของ Project JSON และไฟล์เก่ายังนำเข้าได้

หัวข้อ “ก่อนฝึกโมเดล AI” ระบุข้อมูลและการประเมินที่ต้องมีก่อนฝึกโมเดล: งานที่นิยามชัด ข้อมูลหลายสถานที่ ป้ายกำกับที่ผู้เชี่ยวชาญตรวจสอบ การแบ่งชุดตามสถานที่ และการวัด false alarms / precision / recall ปัจจุบันระบบยังเป็น geometry screening ไม่ใช่โมเดลที่ฝึกแล้ว

## UI จาก main
คงภาษาภาพของ main: สีครีม/แดง/ชมพู/เหลือง/มิ้นต์, typography, collage, workflow band, sidebar, evidence panels, criteria cards, results dashboard และ human-review layout ทั้งหมดรวมในแอปเดียวเพื่อให้ข้อมูลเชื่อมกัน ข้อมูลจำลองและคะแนนกำหนดตายตัวถูกแทนด้วยข้อมูลโครงการและผลคำนวณจริง

## JSON ที่เปิดวิเคราะห์ได้
- `{ "units":"m", "xyz":[[0,0,0], ...] }`
- `{ "units":"mm", "points":[{"x":0,"y":0,"z":0}, ...] }`
- `{ "units":"m", "vertices":[[0,0,0], ...], "faces":[[0,1,2], ...] }`
- Three.js **BufferGeometry** JSON: `data.attributes.position.array` (`itemSize:3`) และ `data.index.array`
- Project JSON ของ v9 และผล Colab v9 ยังคงนำเข้าได้ โดยผลวิเคราะห์ต้องตรงกับ project_id และ source ของโมเดล

หน่วยรองรับ m/cm/mm; ถ้า JSON ไม่ระบุ units จะใช้ตัวเลือกหน่วยหน้า Workspace
รองรับสูงสุด 100,000 vertices / 200,000 triangular faces ต่อโมเดล; ไม่รองรับ scene transforms หรือ glTF โดยตรง ให้ export world-space vertices ก่อน
XYZ / CSV / ASCII PLY ใช้ parser ของ v9 ซึ่งอาจลดจำนวนจุดก่อนเข้าแอป; binary PLY, LAS, LAZ, E57 ต้องแปลงก่อน

## วิธีวิเคราะห์ใน HTML
ทำงานใน Web Worker เพื่อไม่ให้หน้าเว็บค้าง:
- ขอบเขต XYZ และ centroid จาก vertices ที่นำเข้า
- พื้นที่ผิวจากสามเหลี่ยมที่ให้มา ไม่ประมาณพื้นที่/ปริมาตรจาก point cloud
- จำนวนพิกัดซ้ำ
- KD-tree หาจุดเพื่อนบ้าน, local covariance/PCA, nearest-neighbor spacing, roughness proxy, curvature และ neighborhood radius
- ใช้ robust median/MAD แบบ one-sided เพื่อชี้ inspection candidates ปรับ k=12/20/32 และ threshold=1–10 ได้
- วิเคราะห์รูปทรงสูงสุด 12,000 จุด โดยเลือกทุกลำดับที่ n หากอินพุตมีมากกว่านั้น; บันทึกวิธี sampling ในรายงาน
- โมเดลน้อยกว่า 30 จุดยังคำนวณขนาดและพื้นที่ mesh ได้ แต่ไม่มีการคัดกรองความผิดปกติ
- พิกัดซ้ำทั้งหมดหรือไม่มีช่องข้อมูลที่มีความแปรผันจะระบุ DEGENERATE_GEOMETRY

วิธีนี้เป็น **browser geometry screening** ไม่ใช่ IsolationForest ของ Colab v8/v9 จึงไม่ควรเทียบจำนวนจุดที่ flag ว่าเป็นผลจากโมเดลเดียวกัน ไม่มี LLM และไม่มีการจัดระดับความเสียหายอัตโนมัติ
ผลคัดกรองไม่ยืนยันความเสียหาย/สาเหตุ/ความแท้/คุณค่าทางวัฒนธรรม คำตัดสิน Nara/UNESCO ต้องมีการทบทวนและหลักฐานทางประวัติศาสตร์/ชุมชนประกอบ คะแนน % บน dashboard คือความครบถ้วนของการทบทวนเท่านั้น

## โมเดล Pomposa
ตัวอย่างวัดจริง 6,000 จุดจากชุด 30,000 จุดที่ฝังใน notebook v8 ที่ผู้ใช้ให้มา ไม่ได้ดาวน์โหลด E57 ใหม่
- ชุด 30,000 จุดเดิมตรวจ SHA256: `1b7ae5d7aa63f8270b44efb163353ff22ebb660ede5b86d3673d3ada58fbd9f4`
- Display sample: เลือก 6,000 ลำดับกระจายทั่วชุด และปัดพิกัด 6 ทศนิยม ตาม v9
- Drive source: https://drive.google.com/drive/folders/1znFC94jXAEkFJDWjb4-ZZnH0_erX-GyN?usp=sharing
- ค่าเริ่มต้น k=20, threshold=3.5 คำนวณได้ 428 candidates จาก 6,000 จุด เป็น heuristic ที่ยังไม่มี ground truth
- ตัวอย่างนี้เป็น point cloud ไม่มี faces จึงไม่มีพื้นที่ผิว mesh ให้รายงาน

## หลักฐานอื่น
ภาพ raster แสดงตัวอย่างได้, TXT/MD/CSV อ่านเป็นข้อความ, GeoJSON แสดง geometry โดยไม่มี basemap/registration, canvas sketch บันทึกเป็นหลักฐานภาพได้
PDF/DOCX/IFC/LAS/LAZ/E57 ลงทะเบียน metadata ได้ แต่ไม่มี parser วิเคราะห์เนื้อหาใน HTML นี้
ไม่มีการส่งไฟล์ไปเซิร์ฟเวอร์; JSON โครงการมีภาพและข้อความที่แนบ จึงควรพิจารณาเนื้อหาก่อนแชร์ การเก็บใน localStorage มีขีดจำกัด ให้ส่งออก JSON หากบันทึกไม่สำเร็จ

## ทดสอบแล้ว
- เปิดไฟล์โดยตรงใน Chromium จริง และใช้ Blob Web Worker แบบออฟไลน์
- วิเคราะห์ Pomposa 6,000 จุด, แสดง candidates, ยกเลิกการประมวลผล
- JSON mesh ลูกบาศก์ 1,000 mm → ขอบเขต 1×1×1 m และพื้นที่ผิว 6 m²
- Three.js BufferGeometry, schema/unit checks, ปฏิเสธพิกัดไม่ใช่ตัวเลขและจำนวน vertices เกินกำหนด
- เพิ่มภาพ GeoJSON บทสัมภาษณ์ sketch; เกณฑ์พร้อมหลักฐานและผู้ประเมิน; human review และ audit
- JSON roundtrip, localStorage reload และหน้าจอมือถือ 390 px
- KD-tree และ PCA เปรียบเทียบกับ SciPy/NumPy อิสระบนตัวอย่างวัดจริง ผ่าน tolerance
- ไม่ได้ทดสอบ Safari ทุกเวอร์ชัน หรือ runtime Google Colab ในบัญชีผู้ใช้; Colab เป็นตัวเลือกเสริมเท่านั้น

## โครงสร้าง
`index.html` ใช้งานได้เอง; `workspace.html`, `results.html`, `review.html` และ `assessment.html` ส่งต่อไปแต่ละหน้าในแอปเดียว
โค้ดสำหรับพัฒนาต่ออยู่ใน `src/` ข้อมูลฟอนต์ Noto Sans Thai ฝังเพื่อให้แสดงภาษาไทยออฟไลน์ได้ ดู `licenses/`
ไฟล์ mockup ภาพเดิมของ main เก็บไว้ที่ `public/mockups/` เป็น visual reference
`api/assess.js` ไม่เรียก backend และตอบ 501; การคำนวณจริงเกิดใน Web Worker ของ HTML
