import codecs
from datetime import datetime, timedelta
import json
import pandas as pd
import numpy as np

def load_csv():
    return pd.read_csv("data/200000_nagano_covid19_patients.csv", skiprows=[0], encoding="shift_jis")

def create_daily(df_orig):

    date_start = datetime.strptime(df_orig.head(1)["事例確定_年月日"], '%Y/%m/%d')
    date_end = datetime.strptime(df_orig.tail(1)["事例確定_年月日"], '%Y/%m/%d')
    def daterange(_start, _end):
        for n in range((_end - _start).days):
            yield _start + timedelta(n)
    df_orig.columns = [d.strftime("%Y/%m/%d") for d in daterange(date_start, date_end)]
    
    # create data
    df = pd.DataFrame()
    for index, row in df_orig.iterrows():
        try:
            r = str(int(row[0]))
            c = str(int(row[1])) + "/" + str(int(row[2]))
            t = row[3]
            if not (c in df.columns):
                df[c] = np.nan
            if not (r in df.index):
                df.loc[r] = np.nan
            df.at[r, c] = t
        except:
            pass
    df = df.fillna(df.mean())
    t_mean = float(df_orig.iloc[:, [3]].mean())
    t_min = float(df_orig.iloc[:, [3]].min())
    t_max = float(df_orig.iloc[:, [3]].max())
    return {"df":df, "mean":t_mean, "min":t_min, "max":t_max}


def write_json(d):
    json.dump({"table":d["df"].values.tolist(),
               "years":d["df"].index.tolist(),
               "dates":d["df"].columns.tolist(),
               "mean":d["mean"],
               "min":d["min"],
               "max":d["max"]},
              codecs.open("data/data.json", 'w', encoding='utf-8'),
              sort_keys=False,
              indent=2)
    

if __name__ == "__main__":
    df_orig = load_csv()
    df = d["df"] 
    write_json(d)
    print("head:", df.head(5))
    
