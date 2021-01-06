curl -O https://www.pref.nagano.lg.jp/hoken-shippei/kenko/kenko/kansensho/joho/documents/200000_nagano_covid19_patients.csv

iconv -c -f sjis -t utf8 200000_nagano_covid19_patients.csv > 200000_nagano_covid19_patients_utf8.csv

sed -i.bak -e '1d' 200000_nagano_covid19_patients_utf8.csv

mv 200000_nagano_covid19_patients* data
cp data/200000_nagano_covid19_patients*.csv docs/data
