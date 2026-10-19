import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { currentStaff, apiUnauthorized, apiForbidden } from '@/lib/auth';
export async function GET(){try{return NextResponse.json(await prisma.diningTable.findMany({orderBy:{name:'asc'}}));}catch{return NextResponse.json({error:'Database is not ready'},{status:503});}}
export async function POST(req:NextRequest){const staff=await currentStaff();if(!staff)return apiUnauthorized();if(staff.role!=='ADMIN')return apiForbidden();try{const body=z.object({name:z.string().trim().min(2).max(60),kind:z.enum(['STANDARD','VIP']).default('STANDARD'),seats:z.number().int().min(1).max(30).default(4)}).parse(await req.json());const table=await prisma.diningTable.create({data:body});return NextResponse.json(table,{status:201});}catch(e){return NextResponse.json({error:'Invalid table or name already exists'},{status:400});}}
