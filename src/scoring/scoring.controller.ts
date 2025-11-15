import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringResultDto } from './dto/scoring-result.dto';
import { RecalculateScoringDto } from './dto/recalculate-scoring.dto';

@Controller('scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  /**
   * Devuelve el ranking de candidatos ordenado por puntaje descendente.
   * Ejemplo: GET /scoring/top?tenant=root&top=10
   */
  @Get('top')
  obtenerTop(
    @Query('tenant') tenant: string,
    @Query('top', new DefaultValuePipe(10), ParseIntPipe) top: number,
  ): Promise<ScoringResultDto[]> {
    if (!tenant) {
      throw new Error('El parámetro tenant es obligatorio');
    }

    return this.scoringService.obtenerTopCandidatos(tenant, top);
  }

  @Post('recalculate')
  async recalculate(@Body() dto: RecalculateScoringDto) {
    if (!dto.tenant && !dto.candidatoId) {
      throw new BadRequestException('Debes enviar tenant o candidatoId');
    }

    if (dto.candidatoId) {
      const result = await this.scoringService.recalcularCandidato(
        dto.candidatoId,
      );
      return { updated: 1, resultados: [result] };
    }

    const total = await this.scoringService.recalcularTenant(dto.tenant!);
    return { updated: total };
  }
}
