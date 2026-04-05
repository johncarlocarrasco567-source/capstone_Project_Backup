<?php
// app/Http/Controllers/SuperAdmin/ReportReviewController.php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;

class ReportReviewController extends Controller
{
    /**
     * List all reports
     */
    public function index(Request $request)
    {
        $reports = Report::with(['branch', 'admin'])
            ->when($request->status, function($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->type, function($query, $type) {
                return $query->where('type', $type);
            })
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));
            
        return response()->json($reports);
    }
    
    /**
     * Get single report details
     */
    public function show(Report $report)
    {
        $report->load(['branch', 'admin']);
        
        return response()->json($report);
    }
    
    /**
     * Approve report
     */
    public function approve(Request $request, Report $report)
    {
        $request->validate([
            'response' => 'required|string'
        ]);
        
        $report->update([
            'status' => 'approved',
            'response' => $request->response
        ]);
        
        // If it's a product proposal, create the product
        if ($report->type === 'product_proposal') {
            $this->handleProductProposal($report);
        }
        
        return response()->json([
            'message' => 'Report approved successfully',
            'report' => $report
        ]);
    }
    
    /**
     * Reject report
     */
    public function reject(Request $request, Report $report)
    {
        $request->validate([
            'response' => 'required|string'
        ]);
        
        $report->update([
            'status' => 'rejected',
            'response' => $request->response
        ]);
        
        return response()->json([
            'message' => 'Report rejected',
            'report' => $report
        ]);
    }
    
    /**
     * Handle product proposal approval
     */
    private function handleProductProposal(Report $report)
    {
        // Parse product proposal data from description
        // This would create the actual product in the system
        // Implementation depends on your product proposal format
    }
}