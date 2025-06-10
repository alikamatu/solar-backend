import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as xlsx from 'xlsx';
import * as csvParser from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../common/entities/file.entity';
import { ProcessingHistory } from '../common/entities/processing-history.entity';
import { User } from '../users/user.entity';
// import { EmailService } from '../email/email.service';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(ProcessingHistory)
    private historyRepository: Repository<ProcessingHistory>,
    // private emailService: EmailService,
  ) {}

  async processVerizonCsv(
    csvPath: string,
    user: User,
    email?: string,
  ): Promise<string> {
    const workbook = xlsx.utils.book_new();
    const rows: Array<{
      'Listing Id': any;
      OEM: any;
      SKU: any;
      Description: any;
      Disposition: any;
      Quantity: number;
      'Unit Awarded Price': number;
    }> = [];

    try {
      // Parse CSV and transform data
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(csvParser())
          .on('data', (row) => {
            // Transform data according to requirements
            const transformedRow = {
              'Listing Id': row['Listing Id'],
              OEM: row.OEM,
              SKU: row.SKU,
              Description: row.Description,
              Disposition: row.Disposition,
              Quantity: Math.round(parseFloat(row.Quantity)), // Convert to whole number
              'Unit Awarded Price': parseFloat(row['Unit Awarded Price']),
            };
            rows.push(transformedRow);
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Create worksheet with transformed data
      const worksheet = xlsx.utils.json_to_sheet(rows);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Verizon Bids');

      // Save processed file
      const outputDir = process.env.PROCESSED_DIR || './processed';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFileName = `verizon-bids-${Date.now()}.xlsx`;
      const outputPath = path.join(outputDir, outputFileName);
      xlsx.writeFile(workbook, outputPath);

      // Save to database
      const fileRecord = this.fileRepository.create({
        filename: outputFileName,
        originalName: path.basename(csvPath),
        path: outputPath,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        user,
      });
      await this.fileRepository.save(fileRecord);

      // Save processing history
      const historyRecord = this.historyRepository.create({
        type: 'conversion',
        inputFile: csvPath,
        outputFile: outputPath,
        user,
        details: { 
          rows: rows.length,
          removedColumns: ['Prop65 Warning'] 
        },
      });
      await this.historyRepository.save(historyRecord);

      // // Send email if provided
      // if (email) {
      //   await this.emailService.sendFile(
      //     email,
      //     outputPath,
      //     'Processed Verizon Bids File'
      //   );
      // }

      return outputPath;
    } catch (error) {
      // Clean up if necessary
      if (fs.existsSync(csvPath)) {
        await unlink(csvPath);
      }
      throw new InternalServerErrorException('Failed to process Verizon CSV file');
    }
  }}