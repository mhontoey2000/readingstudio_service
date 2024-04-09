// const multer = require('multer')

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './uploads')
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//         cb(null, 'File_' + uniqueSuffix + file.originalname)
//     }
// })
// exports.upload = multer({ storage: storage }).single('file')
const fs = require('fs');

async function saveImageToFile(imageData , fileName) {
  if(imageData == null)
    return;
  try {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, ''); // ลบส่วนข้อมูล Base64
    const buffer = Buffer.from(base64Data, 'base64'); // แปลงข้อมูล Base64 เป็น Buffer
    await fs.promises.writeFile(fileName, buffer); // บันทึก Buffer เป็นไฟล์
    console.log(`บันทึกรูปภาพเป็นไฟล์ ${fileName} สำเร็จ`);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกไฟล์รูปภาพ:', error);
    return null;
  }
}

async function readFileAsync(filePath) {
  if(filePath == null)
    return null;
  try {
    const data = await fs.promises.readFile(filePath);
    return data;
  } catch (err) {
    console.error('Error reading file:', err);
    return null;
  }
}

async function writeFileAsync(fileName, binaryData) {
  if(binaryData == null)
    return null;
  try {
    await fs.promises.writeFile(fileName, binaryData);
    console.log('File saved:', fileName);
    return fileName;
  } catch (err) {
    console.error('Error saving file:', err);
    return null;
  }
}
function generateUniqueFileName(floder) {
  const timestamp = Date.now();
  const name = floder === 'picture' ? 'image_' : 'sound_'
  const type = floder === 'picture' ? 'jpg' : 'mp3'
  const fileName = `../frontend/public/${floder}/${name}${timestamp}.${type}`;
  const pathimage = fileName.replace('../frontend/public', '');
  return { fileName, pathimage };
}

function convertBlobToBase64(blobData) {
  if (blobData  && blobData.length > 0) {
    return `data:image/jpeg;base64,${Buffer.from(blobData).toString('base64')}`;
  }
  return null;
}
module.exports = {
  saveImageToFile,readFileAsync,writeFileAsync,generateUniqueFileName,convertBlobToBase64
};