<?php
// database/migrations/2024_01_01_000006_create_branch_ingredients_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBranchIngredientsTable extends Migration
{
    public function up()
    {
        Schema::create('branch_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 2)->default(0);
            $table->timestamps();
            
            $table->unique(['branch_id', 'ingredient_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('branch_ingredients');
    }
}