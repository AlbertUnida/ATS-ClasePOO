import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringResultDto } from './dto/scoring-result.dto';

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
}
