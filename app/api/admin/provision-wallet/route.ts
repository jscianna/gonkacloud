import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateWallet } from '@/lib/wallet/gonka';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check by clerkId first
    let [user] = await db.select().from(users).where(eq(users.clerkId, userId));
    
    if (user) {
      // User exists - check if wallet already provisioned
      if (user.gonkaAddress) {
        return NextResponse.json({ address: user.gonkaAddress, exists: true });
      }
      // User exists but no wallet - add wallet
      const wallet = await generateWallet();
      await db.update(users).set({
        gonkaAddress: wallet.address,
        encryptedMnemonic: wallet.encryptedMnemonic,
      }).where(eq(users.clerkId, userId));
      return NextResponse.json({ address: wallet.address, provisioned: true });
    }
    
    // User doesn't exist by clerkId - create new
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
    
    // Check if email already exists (edge case)
    const [existingByEmail] = await db.select().from(users).where(eq(users.email, email));
    if (existingByEmail) {
      // Update existing user with new clerkId and wallet
      const wallet = await generateWallet();
      await db.update(users).set({
        clerkId: userId,
        gonkaAddress: wallet.address,
        encryptedMnemonic: wallet.encryptedMnemonic,
      }).where(eq(users.email, email));
      return NextResponse.json({ address: wallet.address, updated: true });
    }
    
    // Truly new user
    const wallet = await generateWallet();
    await db.insert(users).values({
      id: crypto.randomUUID(),
      clerkId: userId,
      email,
      balanceUsd: '0.00',
      gonkaAddress: wallet.address,
      encryptedMnemonic: wallet.encryptedMnemonic,
    });
    
    return NextResponse.json({ address: wallet.address, created: true });
  } catch (error: any) {
    console.error('Provision wallet error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
