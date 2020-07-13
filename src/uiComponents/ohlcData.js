import React from "react";
import { useFetch } from "./utils";

import Chart from './ohlcChart';

function OhlcData() {
  const [data, loading] = useFetch(
    "https://cdn.rawgit.com/rrag/react-stockcharts/master/docs/data/MSFT.tsv"
  );

  return (
      <>
      {loading ? (
        "Loading..."
      ) : (
      <Chart data={data}/>
      )}
      </>
  );
}
export default OhlcData;