import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { multerOptions } from './multer.config';
import { FileService } from './file-processing.service';

@Controller('process')
export class FileProcessingController {
  constructor(
    private readonly fileProcessingService: FileService,
  ) {}

  @Post('verizon-csv')
  @UseInterceptors(FilesInterceptor('file', 1, multerOptions))
  async processVerizonCsv(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('email') email: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user; // Adjust typing as needed
    const outputPath = await this.fileProcessingService.processVerizonCsv(
      files[0].path,
      user,
      email,
    );

    // Stream the processed file back to client
    const filename = path.basename(outputPath);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
  }
}