<?php
// database/migrations/2024_01_01_000005_create_ingredients_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateIngredientsTable extends Migration
{
    public function up()
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('unit', 50);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('ingredients');
    }
}