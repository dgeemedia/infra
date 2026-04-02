// apps/api/src/modules/admin/admin.controller.ts
import {
  Controller, Get, Patch, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public }       from '../../common/decorators/public.decorator';
import { AdminGuard }   from '../../common/guards/admin.guard';
import { AdminService } from './admin.service';

// @Public() tells the global ApiKeyGuard to skip this controller.
// AdminGuard (applied below) still verifies the JWT and enforces role === 'ADMIN'.
@Public()
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Platform stats ────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide stats' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  // ── Partners ──────────────────────────────────────────────
  @Get('partners')
  @ApiOperation({ summary: 'List all partners with metrics' })
  async getAllPartners() {
    return this.adminService.getAllPartners();
  }

  @Get('partners/:id')
  @ApiOperation({ summary: 'Get single partner detail' })
  async getPartnerDetail(@Param('id') id: string) {
    return this.adminService.getPartnerDetail(id);
  }

  @Patch('partners/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a partner account' })
  async suspendPartner(@Param('id') id: string) {
    return this.adminService.suspendPartner(id);
  }

  @Patch('partners/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a partner account' })
  async activatePartner(@Param('id') id: string) {
    return this.adminService.activatePartner(id);
  }

  // ── Transactions ──────────────────────────────────────────
  @Get('transactions')
  @ApiOperation({ summary: 'All transactions across all partners' })
  async getAllTransactions(
    @Query('page')       page?:      string,
    @Query('pageSize')   pageSize?:  string,
    @Query('status')     status?:    string,
    @Query('partnerId')  partnerId?: string,
    @Query('startDate')  startDate?: string,
    @Query('endDate')    endDate?:   string,
  ) {
    return this.adminService.getAllTransactions({
      page:      page      ? parseInt(page)     : 1,
      pageSize:  pageSize  ? parseInt(pageSize) : 20,
      status,
      partnerId,
      startDate,
      endDate,
    });
  }

  // ── Flagged payouts ───────────────────────────────────────
  @Get('flagged')
  @ApiOperation({ summary: 'All flagged payouts needing review' })
  async getFlagged() {
    return this.adminService.getFlaggedPayouts();
  }

  @Patch('flagged/:id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release flagged payout to processing' })
  async releaseFlagged(@Param('id') id: string) {
    return this.adminService.releaseFlaggedPayout(id);
  }

  @Patch('flagged/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject flagged payout as failed' })
  async rejectFlagged(@Param('id') id: string) {
    return this.adminService.rejectFlaggedPayout(id);
  }
}