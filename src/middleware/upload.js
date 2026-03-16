import multer from 'multer';

const memoryStorage = multer.memoryStorage();

export const uploadSingle = (fieldName) => multer({ storage: memoryStorage }).single(fieldName);

export const uploadMultiple = (fieldName, maxCount = 10) =>
  multer({ storage: memoryStorage }).array(fieldName, maxCount);

export const uploadCsv = () => multer({ storage: memoryStorage }).single('csv');
