import { createClient } from '@supabase/supabase-js';
import { RetrievalQAChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';

const privateKey = process.env.SUPABASE_PRIVATE_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);

const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

const client = createClient(url, privateKey);

export const searchRestaurant = async (message: string): Promise<string> => {
  const model = new OpenAI();

  // Create a vector store from the documents.
  const vectorStore = await SupabaseVectorStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    {
      client,
      tableName: 'documents',
      queryName: 'match_documents',
    }
  );

  const template = new PromptTemplate({
    inputVariables: ['message'],
    template:
      'あなたは飲食店を紹介するカスタマーセンターの従業員です。ユーザからのメッセージに対して、100文字程度で回答してください。メッセージはユーザが予約を希望している飲食店の特徴です。メッセージは以下になります。{message}',
  });

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
  const result = await chain.call({
    query: await template.format({
      message,
    }),
  });

  return result.text;
};
