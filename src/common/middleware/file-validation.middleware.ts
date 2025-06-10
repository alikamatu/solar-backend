import {
  Injectable,
  NestMiddleware,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class FileValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.file ? [req.file] : req.files as Express.Multer.File[];
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    for (const file of files) {
      if (!allowedMimes.includes(file.mimetype)) {
        throw new UnsupportedMediaTypeException(
          `Invalid file type: ${file.mimetype}`,
        );
      }

      // Check file content for CSV
      if (file.mimetype === 'text/csv') {
        const content = file.buffer.toString();
        if (!content.includes(',')) {
          throw new UnsupportedMediaTypeException('Invalid CSV format');
        }
      }
    }

    next();
  }
}