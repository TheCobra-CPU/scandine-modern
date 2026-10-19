import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET(){try{const categories=await prisma.category.findMany({include:{items:{where:{available:true},orderBy:{name:'asc'}}},orderBy:{name:'asc'}});return NextResponse.json(categories.map(c=>({...c,items:c.items.map(i=>({...i,price:Number(i.price)}))})));}catch{return NextResponse.json({error:'Database is not ready. Run migrations and seed first.'},{status:503});}}
