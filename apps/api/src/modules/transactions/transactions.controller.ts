import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { TransactionsService } from "./transactions.service"
import { Transaction } from "./entities/transaction.entity"
import { CreateSaleDto } from "./dto/create-sale.dto"
import { CreateExpenseDto } from "./dto/create-expense.dto"
import {
  TransactionResponseDto,
  TransactionsResponseDto,
  FinancialSummaryResponseDto,
} from "./dto/transaction-response.dto"
import { TransactionsQueryDto } from "./dto/transactions-query.dto"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { Permissions } from "../auth/decorators/permissions.decorator"
import { Country } from "../products/enums/country.enum"

@ApiTags("admin / transactions")
@Controller("admin/transactions")
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post("sales")
  @Permissions("transactions:write")
  @ApiOperation({ summary: "Create a manual sale (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Sale recorded successfully",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires transactions:write permission" })
  async createSale(
    @Body() createSaleDto: CreateSaleDto,
    @Request() req,
  ): Promise<{ transaction: Transaction }> {
    const transaction = await this.transactionsService.createSale(createSaleDto, req.user.id)
    return { transaction }
  }

  @Post("expenses")
  @Permissions("transactions:write")
  @ApiOperation({ summary: "Record an expense (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Expense recorded successfully",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires transactions:write permission" })
  async createExpense(
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req,
  ): Promise<{ transaction: Transaction }> {
    const transaction = await this.transactionsService.createExpense(
      createExpenseDto,
      req.user.id,
    )
    return { transaction }
  }

  @Get()
  @Permissions("transactions:read")
  @ApiOperation({ summary: "Get all transactions with optional filters (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Transactions retrieved successfully",
    type: TransactionsResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden - Requires transactions:read permission" })
  async findAll(@Query() query: TransactionsQueryDto) {
    return await this.transactionsService.findAll(query)
  }

  @Get("summary")
  @Permissions("transactions:read")
  @ApiOperation({ summary: "Get financial summary (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Summary retrieved successfully",
    type: FinancialSummaryResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden - Requires transactions:read permission" })
  async getSummary(
    @Query("country") country?: Country,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.transactionsService.getSummary(country, startDate, endDate)
  }

  @Get("number/:transactionNumber")
  @Permissions("transactions:read")
  @ApiOperation({ summary: "Get a transaction by transaction number (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Transaction retrieved successfully",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires transactions:read permission" })
  async findByTransactionNumber(
    @Param("transactionNumber") transactionNumber: string,
  ): Promise<{ transaction: Transaction }> {
    const transaction = await this.transactionsService.findByTransactionNumber(transactionNumber)
    return { transaction }
  }

  @Get(":id")
  @Permissions("transactions:read")
  @ApiOperation({ summary: "Get a transaction by ID (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Transaction retrieved successfully",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires transactions:read permission" })
  async findOne(@Param("id") id: string): Promise<{ transaction: Transaction }> {
    const transaction = await this.transactionsService.findOne(+id)
    return { transaction }
  }

  @Delete(":id")
  @Permissions("transactions:delete")
  @ApiOperation({ summary: "Delete a transaction (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Transaction deleted successfully",
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires transactions:delete permission" })
  async delete(@Param("id") id: string): Promise<{ message: string }> {
    await this.transactionsService.delete(+id)
    return { message: "Transaction deleted successfully" }
  }
}
