<?php
// app/Http/Controllers/Admin/ReportController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    /**
     * List branch reports
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        $reports = $branch->reports()
            ->with('admin')
            ->when($request->status, function($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->type, function($query, $type) {
                return $query->where('type', $type);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));
            
        return response()->json($reports);
    }
    
    /**
     * Submit new report
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:product_proposal,damage,other',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'sometimes|in:low,medium,high'
        ]);
        
        $user = Auth::user();
        
        $report = Report::create([
            'branch_id' => $user->branch_id,
            'admin_id' => $user->id,
            'type' => $request->type,
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority ?? 'low',
            'status' => 'pending'
        ]);
        
        return response()->json([
            'message' => 'Report submitted successfully',
            'report' => $report
        ], 201);
    }
    
    /**
     * Get single report details
     */
    public function show(Report $report)
    {
        $user = Auth::user();
        
        // Check if report belongs to user's branch
        if ($report->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $report->load(['branch', 'admin']);
        
        return response()->json($report);
    }
    
    /**
     * Update report (only if pending)
     */
    public function update(Request $request, Report $report)
    {
        $user = Auth::user();
        
        if ($report->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($report->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot update report that has been processed'
            ], 400);
        }
        
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'priority' => 'sometimes|in:low,medium,high'
        ]);
        
        $report->update($request->only(['title', 'description', 'priority']));
        
        return response()->json([
            'message' => 'Report updated successfully',
            'report' => $report
        ]);
    }
    
    /**
     * Cancel report
     */
    public function destroy(Report $report)
    {
        $user = Auth::user();
        
        if ($report->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($report->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot cancel report that has been processed'
            ], 400);
        }
        
        $report->delete();
        
        return response()->json([
            'message' => 'Report cancelled successfully'
        ]);
    }
}