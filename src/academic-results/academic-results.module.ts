import { Module } from '@nestjs/common';
import { AcademicResultsService } from './academic-results.service';
import { AcademicResultsController } from './academic-results.controller';

@Module({
  controllers: [AcademicResultsController],
  providers: [AcademicResultsService],
  exports: [AcademicResultsService],
})
export class AcademicResultsModule {}

