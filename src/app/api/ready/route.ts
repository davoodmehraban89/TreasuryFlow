import {NextResponse} from 'next/server';export async function GET(){return NextResponse.json({status:'ready',bankAdapter:'disabled'},{status:200})}
