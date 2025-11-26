/**
 * Tenant Ontology API Route
 *
 * Provides REST endpoints for managing tenant domain ontologies.
 *
 * GET  /api/mcp/tenant/{id}/ontology - Retrieve tenant ontology
 * PUT  /api/mcp/tenant/{id}/ontology - Update tenant ontology
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTenantOntology,
  upsertTenantOntology,
  isValidUUID,
  getSchemaVersion,
} from '@/lib/ontology';
import type {
  OntologyResponse,
  UpdateOntologyRequest,
} from '@/types/ontology';

// =============================================================================
// Route Configuration
// =============================================================================

// Disable static generation for this dynamic route
export const dynamic = 'force-dynamic';

// =============================================================================
// GET Handler
// =============================================================================

/**
 * GET /api/mcp/tenant/{id}/ontology
 *
 * Retrieves the complete ontology for a specific tenant.
 *
 * @param request - The incoming request
 * @param params - Route parameters containing the tenant ID
 * @returns The tenant ontology or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<OntologyResponse>> {
  try {
    const { id: tenantId } = await params;

    // Validate tenant ID format
    if (!tenantId || !isValidUUID(tenantId)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid tenant ID format. Expected UUID.',
          schemaVersion: getSchemaVersion(),
        },
        { status: 400 }
      );
    }

    // Retrieve the ontology
    const ontology = await getTenantOntology(tenantId);

    // Return 404 if not found
    if (!ontology) {
      return NextResponse.json(
        {
          ok: false,
          error: `Ontology not found for tenant: ${tenantId}`,
          schemaVersion: getSchemaVersion(),
        },
        { status: 404 }
      );
    }

    // Return the ontology
    return NextResponse.json({
      ok: true,
      data: ontology,
      schemaVersion: getSchemaVersion(),
    });
  } catch (error) {
    console.error('Error retrieving tenant ontology:', error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        schemaVersion: getSchemaVersion(),
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT Handler
// =============================================================================

/**
 * PUT /api/mcp/tenant/{id}/ontology
 *
 * Creates or updates the ontology for a specific tenant.
 *
 * @param request - The incoming request with ontology data
 * @param params - Route parameters containing the tenant ID
 * @returns The updated ontology or error response
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<OntologyResponse>> {
  try {
    const { id: tenantId } = await params;

    // Validate tenant ID format
    if (!tenantId || !isValidUUID(tenantId)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid tenant ID format. Expected UUID.',
          schemaVersion: getSchemaVersion(),
        },
        { status: 400 }
      );
    }

    // Parse request body
    let body: UpdateOntologyRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid JSON in request body',
          schemaVersion: getSchemaVersion(),
        },
        { status: 400 }
      );
    }

    // Validate request body structure
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Request body must be a JSON object',
          schemaVersion: getSchemaVersion(),
        },
        { status: 400 }
      );
    }

    // Validate optional fields types
    if (body.domain !== undefined && typeof body.domain !== 'string') {
      return NextResponse.json(
        {
          ok: false,
          error: 'domain must be a string',
          schemaVersion: getSchemaVersion(),
        },
        { status: 400 }
      );
    }

    if (body.entities !== undefined && !Array.isArray(body.entities)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'entities must be an array',
          schemaVersion: getSchemaVersion(),
        },
        { status: 400 }
      );
    }

    if (body.workflows !== undefined && !Array.isArray(body.workflows)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'workflows must be an array',
          schemaVersion: getSchemaVersion(),
        },
        { status: 400 }
      );
    }

    if (body.metrics !== undefined && !Array.isArray(body.metrics)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'metrics must be an array',
          schemaVersion: getSchemaVersion(),
        },
        { status: 400 }
      );
    }

    // Upsert the ontology
    const ontology = await upsertTenantOntology(tenantId, body);

    // Return the updated ontology
    return NextResponse.json({
      ok: true,
      data: ontology,
      schemaVersion: getSchemaVersion(),
    });
  } catch (error) {
    console.error('Error updating tenant ontology:', error);

    // Handle validation errors with 400 status
    if (
      error instanceof Error &&
      (error.message.includes('must have') ||
        error.message.includes('must be') ||
        error.message.includes('Invalid'))
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          schemaVersion: getSchemaVersion(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        schemaVersion: getSchemaVersion(),
      },
      { status: 500 }
    );
  }
}
