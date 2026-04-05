<?php
// database/migrations/2024_01_01_000015_create_stock_movements_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStockMovementsTable extends Migration
{
    public function up()
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('type', ['purchase', 'usage', 'adjustment', 'waste']);
            $table->decimal('quantity', 10, 2);
            $table->decimal('previous_quantity', 10, 2);
            $table->decimal('new_quantity', 10, 2);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            
            $table->index(['branch_id', 'created_at']);
            $table->index('ingredient_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('stock_movements');
    }
}