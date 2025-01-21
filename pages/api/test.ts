// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable ,{Table} from "airtable";
import { Console } from "console";
import Cookies  from "js-cookie";
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest,res: NextApiResponse) {

  res.status(200).json(req.cookies.token)
}

  // export base;