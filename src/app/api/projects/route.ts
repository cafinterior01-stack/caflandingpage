import { NextRequest, NextResponse } from 'next/server';
import {
  readDb,
  saveDb,
  parseSessionToken,
  InteriorDesignProjectRecord,
  InteriorProjectMilestone,
} from '@/lib/db-store';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('caf_session')?.value;
  const session = parseSessionToken(token);
  const { searchParams } = new URL(request.url);
  const projectNumber = searchParams.get('projectNumber')?.trim();

  const db = readDb();

  if (projectNumber) {
    const project = db.interiorProjects.find(
      (p) =>
        p.projectNumber.toLowerCase() === projectNumber.toLowerCase() ||
        p.id === projectNumber
    );
    if (!project) {
      return NextResponse.json(
        { error: `No interior design project found matching "${projectNumber}". Try CAF-PRJ-2026-701.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ project });
  }

  if (session?.role === 'ADMIN') {
    return NextResponse.json({ projects: db.interiorProjects });
  }

  if (session) {
    const myProjects = db.interiorProjects.filter(
      (p) =>
        p.userId === session.id ||
        p.customerEmail.toLowerCase() === session.email.toLowerCase()
    );
    return NextResponse.json({ projects: myProjects });
  }

  return NextResponse.json({ projects: db.interiorProjects });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('caf_session')?.value;
    const session = parseSessionToken(token);
    const body = await request.json();

    // Update milestone if action === 'UPDATE_MILESTONE'
    if (body.action === 'UPDATE_MILESTONE') {
      const { projectId, milestoneId, status, completionPercent, deliverableNote } = body;
      const db = readDb();
      const prjIdx = db.interiorProjects.findIndex(
        (p) => p.id === projectId || p.projectNumber === projectId
      );
      if (prjIdx === -1) {
        return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
      }

      const project = db.interiorProjects[prjIdx];
      const msIdx = project.milestones.findIndex((m) => m.id === milestoneId);
      if (msIdx === -1) {
        return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
      }

      if (status) project.milestones[msIdx].status = status;
      if (completionPercent !== undefined) {
        project.milestones[msIdx].completionPercent = Number(completionPercent);
      }
      if (deliverableNote) {
        project.milestones[msIdx].deliverableNote = String(deliverableNote);
      }
      project.milestones[msIdx].updatedAt = new Date().toISOString();

      const totalPct = project.milestones.reduce((acc, m) => acc + m.completionPercent, 0);
      project.overallProgressPercent = Math.round(totalPct / project.milestones.length);
      project.updatedAt = new Date().toISOString();

      db.interiorProjects[prjIdx] = project;
      saveDb(db);

      return NextResponse.json({
        project,
        message: 'Project milestone updated.',
      });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      propertyType = 'Residential Duplex / Villa',
      propertyLocation,
      estimatedBudget,
      preferredConsultationDate,
      projectDescription,
      propertyPhotographs = [],
    } = body;

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !serviceType ||
      !propertyLocation ||
      !estimatedBudget ||
      !projectDescription
    ) {
      return NextResponse.json(
        { error: 'Please complete all required consultation and property details.' },
        { status: 400 }
      );
    }

    const randomNum = Math.floor(100 + Math.random() * 900);
    const projectNumber = `CAF-PRJ-2026-${randomNum}`;
    const now = new Date().toISOString();

    const defaultMilestones: InteriorProjectMilestone[] = [
      {
        id: `ms-${Date.now()}-1`,
        stepNumber: 1,
        title: 'Consultation & Site Inspection / Laser Measurement',
        description: `On-site architectural assessment at ${propertyLocation}.`,
        status: 'IN_PROGRESS',
        completionPercent: 25,
        deliverableNote: `Consultation booked for ${preferredConsultationDate || 'upcoming slot'}.`,
        updatedAt: now,
      },
      {
        id: `ms-${Date.now()}-2`,
        stepNumber: 2,
        title: '3D Spatial Visualization, Moodboard & BOQ Proposal',
        description: 'Photorealistic 3D renders, material swatches, and Bill of Quantities sign-off.',
        status: 'UPCOMING',
        completionPercent: 0,
        deliverableNote: 'Commences immediately after site survey.',
        updatedAt: now,
      },
      {
        id: `ms-${Date.now()}-3`,
        stepNumber: 3,
        title: 'Ceiling, Lighting, Acoustic Panelling & Civil Fit-Out',
        description: 'Execution of POP ceilings, wall panelling, wiring, and architectural finishes.',
        status: 'UPCOMING',
        completionPercent: 0,
        deliverableNote: 'Pending proposal sign-off.',
        updatedAt: now,
      },
      {
        id: `ms-${Date.now()}-4`,
        stepNumber: 4,
        title: 'Bespoke Furniture Manufacturing & Soft Furnishings',
        description: 'Workshop fabrication of custom furniture, cabinetry, and drapery.',
        status: 'UPCOMING',
        completionPercent: 0,
        deliverableNote: 'Pending workshop mobilization.',
        updatedAt: now,
      },
      {
        id: `ms-${Date.now()}-5`,
        stepNumber: 5,
        title: 'White-Glove Installation, Styling & Final Handover',
        description: 'On-site installation, quality inspection, and warranty issuance.',
        status: 'UPCOMING',
        completionPercent: 0,
        deliverableNote: 'Final milestone.',
        updatedAt: now,
      },
    ];

    const newProject: InteriorDesignProjectRecord = {
      id: `prj-${Date.now()}`,
      projectNumber,
      userId: session?.id,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerPhone: String(customerPhone).trim(),
      serviceType: String(serviceType).trim(),
      propertyType: String(propertyType).trim(),
      propertyLocation: String(propertyLocation).trim(),
      estimatedBudget: String(estimatedBudget).trim(),
      preferredConsultationDate: preferredConsultationDate || 'Flexible',
      projectDescription: String(projectDescription).trim(),
      propertyPhotographs: Array.isArray(propertyPhotographs) ? propertyPhotographs : [],
      status: 'CONSULTATION_BOOKED',
      assignedArchitect: 'Arc. Tunde Bakare (Senior Lead Interior Architect, CAF Interiors)',
      overallProgressPercent: 5,
      approvedContractAmount: 0,
      amountPaidVerified: 0,
      milestones: defaultMilestones,
      createdAt: now,
      updatedAt: now,
    };

    const db = readDb();
    db.interiorProjects.unshift(newProject);
    saveDb(db);

    return NextResponse.json(
      {
        project: newProject,
        message: `Interior Design Project ${projectNumber} booked! Track your project milestones below.`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to submit interior design consultation booking.' },
      { status: 500 }
    );
  }
}

