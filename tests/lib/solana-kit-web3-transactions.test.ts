import { describe, expect, it } from "vitest";

import {
  legacyTransactionMessageMatchesPreparedAction,
  serializeLegacyVersionedMessage
} from "@/lib/solana-kit/compat/web3-transactions";

async function loadWeb3TestTools() {
  return import("@solana/web3.js");
}

type Web3TestTools = Awaited<ReturnType<typeof loadWeb3TestTools>>;
type TestPublicKey = InstanceType<Web3TestTools["PublicKey"]>;
type TestTransaction = Parameters<typeof serializeLegacyVersionedMessage>[0];

function randomBlockhash(generateKeypair: () => { publicKey: TestPublicKey }): string {
  return generateKeypair().publicKey.toBase58();
}

async function createTransferTransaction(input: {
  payer: TestPublicKey;
  recipient: TestPublicKey;
  blockhash: string;
  lamports: number;
}): Promise<TestTransaction> {
  const {
    SystemProgram,
    TransactionMessage,
    VersionedTransaction
  } = await loadWeb3TestTools();
  const message = new TransactionMessage({
    payerKey: input.payer,
    recentBlockhash: input.blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: input.payer,
        toPubkey: input.recipient,
        lamports: input.lamports
      })
    ]
  }).compileToV0Message();

  return new VersionedTransaction(message);
}

describe("solana-kit web3 transaction boundary", () => {
  it("accepts a signed transaction when only the recent blockhash changed", async () => {
    const { Keypair } = await loadWeb3TestTools();
    const payer = Keypair.generate().publicKey;
    const recipient = Keypair.generate().publicKey;
    const prepared = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });
    const signedWithRefreshedBlockhash = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });

    expect(legacyTransactionMessageMatchesPreparedAction(
      signedWithRefreshedBlockhash,
      serializeLegacyVersionedMessage(prepared)
    )).toBe(true);
  });

  it("rejects a signed transaction when the instruction data changes", async () => {
    const { Keypair } = await loadWeb3TestTools();
    const payer = Keypair.generate().publicKey;
    const recipient = Keypair.generate().publicKey;
    const prepared = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });
    const changedAmount = await createTransferTransaction({
      payer,
      recipient,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 2
    });

    expect(legacyTransactionMessageMatchesPreparedAction(
      changedAmount,
      serializeLegacyVersionedMessage(prepared)
    )).toBe(false);
  });

  it("rejects a signed transaction when the account list changes", async () => {
    const { Keypair } = await loadWeb3TestTools();
    const payer = Keypair.generate().publicKey;
    const prepared = await createTransferTransaction({
      payer,
      recipient: Keypair.generate().publicKey,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });
    const changedRecipient = await createTransferTransaction({
      payer,
      recipient: Keypair.generate().publicKey,
      blockhash: randomBlockhash(Keypair.generate),
      lamports: 1
    });

    expect(legacyTransactionMessageMatchesPreparedAction(
      changedRecipient,
      serializeLegacyVersionedMessage(prepared)
    )).toBe(false);
  });
});
