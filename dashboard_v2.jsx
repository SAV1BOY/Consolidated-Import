import { useState, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Line, Legend } from "recharts";

const RAW = [
{n:1,c:240570,f:"BO GLASS INDUSTRIAL LIMITED",d:"VIDRO ICE PEQUENO",ef:141.0,ed:136.0,mm:4.0,de:34.0,s:0.0,te:136.0,dt:34.0,cf:25.0,tf:0.0,tb:0.0,tn:0.0},
{n:2,c:266756,f:"Beecore",d:"Louver para multipoint",ef:0.0,ed:0.0,mm:0.999,de:0.0,s:0.0,te:0.0,dt:0.0,cf:1.2,tf:0.0,tb:0.0,tn:0.0},
{n:3,c:140123,f:"Beecore",d:"Louver 50mm",ef:2292.0,ed:2086.0,mm:243.0,de:8.58,s:0.0,te:2086.0,dt:8.58,cf:0.58,tf:0.0,tb:0.0,tn:0.0},
{n:4,c:140122,f:"Beecore",d:"Louver 35mm",ef:16.0,ed:16.0,mm:3.0,de:5.33,s:10.0,te:26.0,dt:8.67,cf:0.58,tf:5.8,tb:30.87,tn:61.75},
{n:5,c:142185,f:"Beecore",d:"Optica 8 graus iLed 200 / iLed 100",ef:1051.0,ed:1048.0,mm:35.0,de:29.94,s:0.0,te:1048.0,dt:29.94,cf:0.16,tf:0.0,tb:0.0,tn:0.0},
{n:6,c:163146,f:"Beecore",d:"Louver 70mm",ef:371.0,ed:371.0,mm:6.0,de:61.83,s:0.0,te:371.0,dt:61.83,cf:0.69,tf:0.0,tb:0.0,tn:0.0},
{n:7,c:223879,f:"Beecore",d:"Louver 300x300x6 malha 15x15mm (Descrição Iluminar?)",ef:70.0,ed:63.0,mm:0.999,de:63.06,s:0.0,te:63.0,dt:63.06,cf:1.27,tf:0.0,tb:0.0,tn:0.0},
{n:8,c:223672,f:"Beecore",d:"Louver 23,5mm",ef:199.0,ed:199.0,mm:0.999,de:199.2,s:0.0,te:199.0,dt:199.2,cf:0.49,tf:0.0,tb:0.0,tn:0.0},
{n:9,c:220370,f:"Beecore",d:"Louver 111mm",ef:342.0,ed:342.0,mm:0.999,de:342.34,s:0.0,te:342.0,dt:342.34,cf:0.76,tf:0.0,tb:0.0,tn:0.0},
{n:10,c:223878,f:"Beecore",d:"Louver 100x100mmx6 malha 15x15mm (Descrição Iluminar?)",ef:504.0,ed:504.0,mm:0.999,de:504.5,s:0.0,te:504.0,dt:504.5,cf:0.81,tf:0.0,tb:0.0,tn:0.0},
{n:11,c:161379,f:"DARKOO",d:"HOLDE 6 FOCOS + OPTICA 36° MULTIPOINT BRANCO (DK151-ZJ-6H1-WT-36deg)",ef:82.0,ed:72.0,mm:22.0,de:3.27,s:100.0,te:172.0,dt:7.82,cf:1.25,tf:125.0,tb:665.4,tn:1330.8},
{n:12,c:142189,f:"DARKOO",d:"HOLDE 6 FOCOS + OPTICA 36° MULTIPOINT PRETO (DK151-ZJ-6H1-BK-36deg)",ef:101.0,ed:48.0,mm:33.0,de:1.45,s:220.0,te:268.0,dt:8.12,cf:0.9,tf:198.0,tb:1053.99,tn:2107.99},
{n:13,c:142186,f:"DARKOO",d:"Optica 25 graus iLed 200 / iLed 100",ef:1257.0,ed:1042.0,mm:180.0,de:5.79,s:400.0,te:1442.0,dt:8.01,cf:0.16,tf:64.0,tb:340.68,tn:681.37},
{n:14,c:142187,f:"DARKOO",d:"HOLDE 1 FOCO + OPTICA 36° MULTIPOINT PRETO (DK-S30-GSZ-BK-36deg)",ef:481.0,ed:477.0,mm:21.0,de:22.71,s:0.0,te:477.0,dt:22.71,cf:0.2,tf:0.0,tb:0.0,tn:0.0},
{n:15,c:247270,f:"DARKOO",d:"MOLDURA MULTIPOINT 6 FOCOS BRANCO (DK-149-GSZ-6H1-WT-A1)",ef:719.0,ed:709.0,mm:21.0,de:33.76,s:0.0,te:709.0,dt:33.76,cf:0.35,tf:0.0,tb:0.0,tn:0.0},
{n:16,c:247268,f:"DARKOO",d:"HOLDE 1 FOCO + OPTICA 10° MULTIPOINT BRANCO (DK-S30-GSZ-WT-10deg)",ef:325.0,ed:325.0,mm:7.0,de:46.43,s:0.0,te:325.0,dt:46.43,cf:0.12,tf:0.0,tb:0.0,tn:0.0},
{n:17,c:194981,f:"DARKOO",d:"Óptica 24° Ø 50mm iLed 600 / iLed 1200",ef:849.0,ed:759.0,mm:55.0,de:13.8,s:0.0,te:759.0,dt:13.8,cf:0.55,tf:0.0,tb:0.0,tn:0.0},
{n:18,c:161377,f:"DARKOO",d:"HOLDE 1 FOCO + OPTICA 36° MULTIPOINT BRANCO (DK-S30-GSZ-WT-36deg)",ef:934.0,ed:914.0,mm:22.0,de:41.55,s:0.0,te:914.0,dt:41.55,cf:0.2,tf:0.0,tb:0.0,tn:0.0},
{n:19,c:247272,f:"DARKOO",d:"MOLDURA MULTIPOINT 1 FOCO BRANCO (DK-S30-GSZ-WT-A1)",ef:1247.0,ed:1227.0,mm:29.0,de:42.31,s:0.0,te:1227.0,dt:42.31,cf:0.35,tf:0.0,tb:0.0,tn:0.0},
{n:20,c:247269,f:"DARKOO",d:"MOLDURA MULTIPOINT 6 FOCOS PRETO (DK-149-GSZ-6H1-BK-A1)",ef:1556.0,ed:1509.0,mm:40.0,de:37.73,s:0.0,te:1509.0,dt:37.73,cf:0.35,tf:0.0,tb:0.0,tn:0.0},
{n:21,c:168637,f:"DARKOO",d:"Óptica 12° Ø 50mm iLed 600 / iLed 1200",ef:778.0,ed:771.0,mm:60.0,de:12.85,s:0.0,te:771.0,dt:12.85,cf:0.55,tf:0.0,tb:0.0,tn:0.0},
{n:22,c:247271,f:"DARKOO",d:"MOLDURA MULTIPOINT 1 FOCO PRETO (DK-S30-GSZ-BK-A1)",ef:1149.0,ed:1145.0,mm:23.0,de:49.78,s:0.0,te:1145.0,dt:49.78,cf:0.35,tf:0.0,tb:0.0,tn:0.0},
{n:23,c:247266,f:"DARKOO",d:"HOLDE 6 FOCOS + OPTICA 10° MULTIPOINT BRANCO (DK151-ZJ-6H1-WT-10deg)",ef:453.0,ed:453.0,mm:1.0,de:453.0,s:0.0,te:453.0,dt:453.0,cf:0.9,tf:0.0,tb:0.0,tn:0.0},
{n:24,c:168640,f:"DARKOO",d:"Óptica 36° Ø 70mm iLed 600 / iLed 1600 / iLed 2300",ef:368.0,ed:367.0,mm:4.0,de:91.75,s:0.0,te:367.0,dt:91.75,cf:0.6,tf:0.0,tb:0.0,tn:0.0},
{n:25,c:247265,f:"DARKOO",d:"HOLDE 6 FOCOS + OPTICA 10° MULTIPOINT PRETO (DK151-ZJ-6H1-BK-10deg)",ef:199.0,ed:193.0,mm:11.0,de:17.55,s:0.0,te:193.0,dt:17.55,cf:0.9,tf:0.0,tb:0.0,tn:0.0},
{n:26,c:247267,f:"DARKOO",d:"HOLDE 1 FOCO + OPTICA 10° MULTIPOINT PRETO (DK-S30-GSZ-BK-10deg)",ef:602.0,ed:598.0,mm:8.0,de:74.75,s:0.0,te:598.0,dt:74.75,cf:0.12,tf:0.0,tb:0.0,tn:0.0},
{n:27,c:223888,f:"DARKOO",d:"otica facho medio simetrico 30° PARA FRIZO",ef:1500.0,ed:1500.0,mm:2.0,de:750.0,s:0.0,te:1500.0,dt:750.0,cf:0.36,tf:0.0,tb:0.0,tn:0.0},
{n:28,c:223886,f:"DARKOO",d:"mascara 6 focos p trilho magnetico branco PARA FRIZO",ef:1634.0,ed:1634.0,mm:2.0,de:817.0,s:0.0,te:1634.0,dt:817.0,cf:0.24,tf:0.0,tb:0.0,tn:0.0},
{n:29,c:194980,f:"DARKOO",d:"CONECTOR iLed600/iLed1200/ iLed1600/iLed2300",ef:1586.0,ed:1489.0,mm:116.0,de:1490.49,s:0.0,te:1489.0,dt:12.84,cf:0.12,tf:0.0,tb:0.0,tn:0.0},
{n:30,c:223885,f:"DARKOO",d:"mascara 6 focos p trilho magnetico preto PARA FRIZO",ef:836.0,ed:836.0,mm:2.0,de:418.0,s:0.0,te:836.0,dt:418.0,cf:0.24,tf:0.0,tb:0.0,tn:0.0},
{n:31,c:168639,f:"DARKOO",d:"Óptica 12° Ø 70mm iLed 600 / iLed 1600 / iLed 2300",ef:604.0,ed:602.0,mm:4.0,de:150.5,s:0.0,te:602.0,dt:150.5,cf:0.6,tf:0.0,tb:0.0,tn:0.0},
{n:32,c:194988,f:"DARKOO",d:"Máscara Chip 3 Focos PARA SLOT",ef:302.0,ed:302.0,mm:0.999,de:302.3,s:0.0,te:302.0,dt:302.3,cf:0.0,tf:0.0,tb:0.0,tn:0.0},
{n:33,c:194987,f:"DARKOO",d:"Ótica 20° Chip 3 Focos PARA SLOT",ef:308.0,ed:308.0,mm:0.999,de:308.31,s:0.0,te:308.0,dt:308.31,cf:0.0,tf:0.0,tb:0.0,tn:0.0},
{n:34,c:194986,f:"DARKOO",d:"Máscara Chip 1 Foco PARA SLOT",ef:316.0,ed:316.0,mm:0.999,de:316.32,s:0.0,te:316.0,dt:316.32,cf:0.0,tf:0.0,tb:0.0,tn:0.0},
{n:35,c:194985,f:"DARKOO",d:"Óptica 20° Chip 1 Foco PARA SLOT",ef:319.0,ed:319.0,mm:0.999,de:319.32,s:0.0,te:319.0,dt:319.32,cf:0.0,tf:0.0,tb:0.0,tn:0.0},
{n:36,c:195029,f:"DARKOO",d:"Mascara Mult Vuu 6 Focos",ef:613.0,ed:613.0,mm:0.999,de:613.61,s:0.0,te:613.0,dt:613.61,cf:0.33,tf:0.0,tb:0.0,tn:0.0},
{n:37,c:195018,f:"DARKOO",d:"Óptica 25° Mult Vuu 2 Focos",ef:864.0,ed:864.0,mm:0.999,de:864.86,s:0.0,te:864.0,dt:864.86,cf:0.12,tf:0.0,tb:0.0,tn:0.0},
{n:38,c:195019,f:"DARKOO",d:"Mascara Mult Vuu 2 Focos",ef:869.0,ed:869.0,mm:0.999,de:869.87,s:0.0,te:869.0,dt:869.87,cf:0.15,tf:0.0,tb:0.0,tn:0.0},
{n:39,c:195026,f:"DARKOO",d:"Óptica 25° Mult Vuu 6 Focos",ef:1102.0,ed:1102.0,mm:0.999,de:1103.1,s:0.0,te:1102.0,dt:1103.1,cf:0.19,tf:0.0,tb:0.0,tn:0.0},
{n:40,c:223887,f:"DARKOO",d:"otica facho fechado simetrico 15° PARA SLOT",ef:1321.0,ed:1321.0,mm:2.0,de:660.5,s:0.0,te:1321.0,dt:660.5,cf:0.36,tf:0.0,tb:0.0,tn:0.0},
{n:41,c:219910,f:"DGZHENXUAN",d:"PINO POGO",ef:1300.0,ed:1140.0,mm:3.0,de:380.0,s:0.0,te:1140.0,dt:380.0,cf:0.21,tf:0.0,tb:0.0,tn:0.0},
{n:42,c:95133,f:"Enner",d:"DISSIPADOR DE CALOR Ø 36,8 X 50mm ENNER TECHNOLOGY (REF. 27) ANODIZADO",ef:1673.0,ed:1583.0,mm:110.0,de:14.39,s:0.0,te:1583.0,dt:14.39,cf:1.77,tf:0.0,tb:0.0,tn:0.0},
{n:43,c:266670,f:"GREEN POWER",d:"DRIVER 24V 120W",ef:0.0,ed:0.0,mm:0.999,de:0.0,s:0.0,te:0.0,dt:0.0,cf:5.82,tf:0.0,tb:0.0,tn:0.0},
{n:44,c:266668,f:"GREEN POWER",d:"Driver 24W 24V",ef:15.0,ed:13.0,mm:10.0,de:1.3,s:75.0,te:88.0,dt:8.8,cf:2.45,tf:183.75,tb:978.14,tn:1956.28},
{n:45,c:161880,f:"GREEN POWER",d:"Driver 72W 24v",ef:1340.0,ed:1305.0,mm:142.0,de:9.19,s:0.0,te:1305.0,dt:9.19,cf:3.66,tf:0.0,tb:0.0,tn:0.0},
{n:46,c:266669,f:"GREEN POWER",d:"Driver 36W 24V",ef:600.0,ed:590.0,mm:14.0,de:42.14,s:0.0,te:590.0,dt:42.14,cf:2.72,tf:0.0,tb:0.0,tn:0.0},
{n:47,c:161879,f:"GREEN POWER",d:"Driver 48W 24v",ef:1223.0,ed:1210.0,mm:18.0,de:67.22,s:0.0,te:1210.0,dt:67.22,cf:2.86,tf:0.0,tb:0.0,tn:0.0},
{n:48,c:143850,f:"HI ZEALED",d:"Driver Multipoint 6x iLed 200 16~20V 700mA",ef:173.0,ed:57.0,mm:105.0,de:0.54,s:800.0,te:857.0,dt:8.16,cf:2.58,tf:2064.0,tb:10987.08,tn:21974.17},
{n:49,c:195514,f:"HI ZEALED",d:"Driver iLed 500 3-9VDC 600mA",ef:1143.0,ed:769.0,mm:294.0,de:2.62,s:1600.0,te:2369.0,dt:8.06,cf:1.4,tf:2240.0,tb:11923.97,tn:23847.94},
{n:50,c:143840,f:"HI ZEALED",d:"Driver iLed 200 3~6V 700mA",ef:1269.0,ed:1102.0,mm:153.0,de:7.2,s:150.0,te:1252.0,dt:8.18,cf:1.4,tf:210.0,tb:1117.87,tn:2235.74},
{n:51,c:143839,f:"HI ZEALED",d:"Driver iLed 100 3~6V 350mA",ef:676.0,ed:624.0,mm:48.0,de:13.0,s:0.0,te:624.0,dt:13.0,cf:1.24,tf:0.0,tb:0.0,tn:0.0},
{n:52,c:143848,f:"HI ZEALED",d:"Driver Multipoint 6x iLed 100 16~20V 350mA",ef:499.0,ed:488.0,mm:6.0,de:81.33,s:0.0,te:488.0,dt:81.33,cf:1.42,tf:0.0,tb:0.0,tn:0.0},
{n:53,c:195526,f:"HI ZEALED",d:"Driver iLed 600 Dimerizado Triac 220v 3-9VDC 600mA",ef:161.0,ed:161.0,mm:0.999,de:161.16,s:0.0,te:161.0,dt:161.16,cf:6.1,tf:0.0,tb:0.0,tn:0.0},
{n:54,c:195521,f:"HI ZEALED",d:"Driver iLed 600 Dimerizado Triac 127v 3-9VDC 600mA",ef:738.0,ed:738.0,mm:0.999,de:738.74,s:0.0,te:738.0,dt:738.74,cf:5.8,tf:0.0,tb:0.0,tn:0.0},
{n:55,c:146874,f:"HUA FENG",d:"iLed - S 2700",ef:481.0,ed:431.0,mm:131.0,de:3.29,s:600.0,te:1031.0,dt:7.87,cf:8.75,tf:5250.0,tb:27946.8,tn:55893.6},
{n:56,c:221914,f:"HUA FENG",d:"Iled S 1000",ef:109.0,ed:108.0,mm:3.0,de:36.0,s:0.0,te:108.0,dt:36.0,cf:5.0,tf:0.0,tb:0.0,tn:0.0},
{n:57,c:221910,f:"HUA FENG",d:"iLed - S 1700",ef:155.0,ed:155.0,mm:5.0,de:31.0,s:0.0,te:155.0,dt:31.0,cf:8.4,tf:0.0,tb:0.0,tn:0.0},
{n:58,c:255288,f:"HUA FENG",d:"iLed - S 4000",ef:386.0,ed:386.0,mm:0.999,de:386.39,s:0.0,te:386.0,dt:386.39,cf:7.5,tf:0.0,tb:0.0,tn:0.0},
{n:59,c:231627,f:"L POWER",d:"DRIVER 24V 48W",ef:0.0,ed:0.0,mm:0.999,de:0.0,s:0.0,te:0.0,dt:0.0,cf:1.8,tf:0.0,tb:0.0,tn:0.0},
{n:60,c:231628,f:"L POWER",d:"DRIVER 24V 72W",ef:0.0,ed:0.0,mm:0.999,de:0.0,s:0.0,te:0.0,dt:0.0,cf:2.08,tf:0.0,tb:0.0,tn:0.0},
{n:61,c:231626,f:"L POWER",d:"DRIVER 24V 36W",ef:0.0,ed:0.0,mm:0.999,de:0.0,s:0.0,te:0.0,dt:0.0,cf:1.5,tf:0.0,tb:0.0,tn:0.0},
{n:62,c:231629,f:"L POWER",d:"DRIVER 24V 120W",ef:40.0,ed:24.0,mm:23.0,de:1.04,s:160.0,te:184.0,dt:8.0,cf:3.6,tf:576.0,tb:3066.16,tn:6132.33},
{n:63,c:231623,f:"L POWER",d:"DRIVER 24V 24W",ef:1969.0,ed:1964.0,mm:6.0,de:327.33,s:0.0,te:1964.0,dt:327.33,cf:1.0,tf:0.0,tb:0.0,tn:0.0},
{n:64,c:242134,f:"LEDLINK",d:"ÓPTICA 15º LEDLINK BLACK HOLDER (LL01AK-DRT15L06-M1)",ef:626.0,ed:500.0,mm:21.0,de:23.81,s:0.0,te:500.0,dt:23.81,cf:0.2,tf:0.0,tb:0.0,tn:0.0},
{n:65,c:242135,f:"LEDLINK",d:"ÓPTICA 38º LEDLINK BLACK HOLDER (LL01AK-DRT38L06-M1)",ef:1570.0,ed:1548.0,mm:32.0,de:48.38,s:0.0,te:1548.0,dt:48.38,cf:0.2,tf:0.0,tb:0.0,tn:0.0},
{n:66,c:273378,f:"RANTOON",d:"Placa de LED 18W - 2700k - 127 V - linha Light Light",ef:466.0,ed:420.0,mm:34.0,de:12.35,s:0.0,te:420.0,dt:12.35,cf:3.0,tf:0.0,tb:0.0,tn:0.0},
{n:67,c:273456,f:"RANTOON",d:"Placa de LED 18W - 2700k - 220 V - linha Light Light",ef:349.0,ed:345.0,mm:8.0,de:43.12,s:0.0,te:345.0,dt:43.12,cf:3.0,tf:0.0,tb:0.0,tn:0.0},
{n:68,c:130315,f:"RISHANG",d:"FITA LED L=10mm 24V 3000K 18W/m IP33 2600lm/m (RD00K2TC-A-T) ROLO 3 METROS",ef:0.0,ed:0.0,mm:0.999,de:0.0,s:0.0,te:0.0,dt:0.0,cf:11.99,tf:0.0,tb:0.0,tn:0.0},
{n:69,c:109857,f:"SC POWER",d:"DRIVER DIMERIZAVEL TRIAC 100-130Vac 30-50Vdc 350mA (KI-50350-TDL SC POWER)",ef:20.0,ed:20.0,mm:0.999,de:20.02,s:0.0,te:20.0,dt:20.02,cf:8.8,tf:0.0,tb:0.0,tn:0.0},
{n:70,c:211938,f:"SC POWER",d:"DRIVER DIMERIZAVEL iLed200/600/1200/1600/2300 - 3A 42V - 20W - MULTICORRENTE ...",ef:291.0,ed:291.0,mm:5.0,de:58.2,s:0.0,te:291.0,dt:58.2,cf:9.7,tf:0.0,tb:0.0,tn:0.0},
{n:71,c:234709,f:"SURNOUNTOR",d:"Placa Interrupitor Dimmer Balance",ef:127.0,ed:124.0,mm:2.0,de:62.0,s:0.0,te:124.0,dt:62.0,cf:2.6,tf:0.0,tb:0.0,tn:0.0},
{n:72,c:231868,f:"TUER",d:"Articulacao latão natural para spot 13mm x 35mm ROSCAS M10 e M8",ef:0.0,ed:0.0,mm:0.999,de:0.0,s:0.0,te:0.0,dt:0.0,cf:0.73,tf:0.0,tb:0.0,tn:0.0},
{n:73,c:239135,f:"TUER",d:"Articulacao Cromada para spot 13mm x 35mm ROSCAS M10 e M8 WHITE",ef:670.0,ed:460.0,mm:153.0,de:3.01,s:800.0,te:1260.0,dt:8.24,cf:0.7,tf:560.0,tb:2980.99,tn:5961.98},
{n:74,c:246181,f:"TUER",d:"MICROCANOPLA CÔNICA DE REGULAGEM COMPLETA (OXIDADA PRETA - TUER)",ef:293.0,ed:286.0,mm:66.0,de:4.33,s:250.0,te:536.0,dt:8.12,cf:0.8,tf:200.0,tb:1064.64,tn:2129.28},
{n:75,c:239132,f:"TUER",d:"ARTICULAÇÃO DE LATÃO PARA SPOT PEN Ø1/2\" x 82mm (OXIDADA BRANCA)",ef:1166.0,ed:921.0,mm:191.0,de:4.82,s:600.0,te:1521.0,dt:7.96,cf:0.98,tf:588.0,tb:3130.04,tn:6260.08},
{n:76,c:239136,f:"TUER",d:"Articulacao Cromada para spot 13mm x 35mm ROSCAS M10 e M8 BLACK",ef:554.0,ed:521.0,mm:54.0,de:9.65,s:0.0,te:521.0,dt:9.65,cf:0.58,tf:0.0,tb:0.0,tn:0.0},
{n:77,c:248170,f:"TUER",d:"CORPO NANO PEN SPOT d=10 x 87,5mm BRANCO (TUER)",ef:400.0,ed:359.0,mm:35.0,de:10.26,s:0.0,te:359.0,dt:10.26,cf:1.8,tf:0.0,tb:0.0,tn:0.0},
{n:78,c:239131,f:"TUER",d:"ARTICULAÇÃO DE LATÃO NATURAL PARA SPOT PEN Ø1/2\" x 54,5mm (COR BRANCA)",ef:1135.0,ed:1042.0,mm:69.0,de:15.1,s:0.0,te:1042.0,dt:15.1,cf:0.81,tf:0.0,tb:0.0,tn:0.0},
{n:79,c:223913,f:"TUER",d:"ARTICULAÇÃO DE LATÃO NATURAL PARA SPOT PEN Ø1/2\" x 54,5mm (preto)",ef:1347.0,ed:1297.0,mm:127.0,de:10.21,s:0.0,te:1297.0,dt:10.21,cf:0.81,tf:0.0,tb:0.0,tn:0.0},
{n:80,c:223914,f:"TUER",d:"ARTICULAÇÃO DE LATÃO PARA SPOT PEN Ø1/2\" x 82mm (preto)",ef:1200.0,ed:1109.0,mm:63.0,de:17.6,s:0.0,te:1109.0,dt:17.6,cf:0.98,tf:0.0,tb:0.0,tn:0.0},
{n:81,c:248171,f:"TUER",d:"CORPO NANO PEN SPOT d=10 x 87,5mm PRETO (TUER)",ef:338.0,ed:311.0,mm:18.0,de:17.28,s:0.0,te:311.0,dt:17.28,cf:1.8,tf:0.0,tb:0.0,tn:0.0},
{n:82,c:246182,f:"TUER",d:"MICROCANOPLA CÔNICA DE REGULAGEM COMPLETA ( BRANCA - TUER)",ef:1050.0,ed:1050.0,mm:23.0,de:45.65,s:0.0,te:1050.0,dt:45.65,cf:0.8,tf:0.0,tb:0.0,tn:0.0},
{n:83,c:232799,f:"TUER",d:"ARTICULAÇÃO PARA STRONG SPOT D=22mm H=42mm",ef:1082.0,ed:1049.0,mm:22.0,de:47.68,s:0.0,te:1049.0,dt:47.68,cf:0.65,tf:0.0,tb:0.0,tn:0.0},
{n:84,c:163556,f:"TUER",d:"NIPLE CROMADO M10x1 PARA REGULAGEM DE CORDOALHA (TE-B6009) TUER",ef:2113.0,ed:2089.0,mm:22.0,de:94.95,s:0.0,te:2089.0,dt:94.95,cf:0.25,tf:0.0,tb:0.0,tn:0.0},
{n:85,c:218275,f:"TUER",d:"Articulação especial recartilhada para TAG",ef:478.0,ed:478.0,mm:7.0,de:68.29,s:0.0,te:478.0,dt:68.29,cf:1.8,tf:0.0,tb:0.0,tn:0.0},
{n:86,c:233465,f:"TUER",d:"PORCA ESPECIAL RECARTILHADA M4x0,5 (KIT FIXAÇÃO DE CORDOALHAS)",ef:1954.0,ed:1951.0,mm:15.0,de:130.07,s:0.0,te:1951.0,dt:130.07,cf:0.12,tf:0.0,tb:0.0,tn:0.0},
{n:87,c:237188,f:"TUER",d:"PORCA ESPECIAL RECARTILHADA M4x0,5 (KIT FIXAÇÃO DE CORDOALHAS)",ef:1534.0,ed:1522.0,mm:24.0,de:63.42,s:0.0,te:1522.0,dt:63.42,cf:0.12,tf:0.0,tb:0.0,tn:0.0},
{n:88,c:233287,f:"TUER",d:"PARAFUSO ESPECIAL M4x0,5 (KIT FIXAÇÃO DE CORDOALHAS)",ef:1424.0,ed:1421.0,mm:17.0,de:83.59,s:0.0,te:1421.0,dt:83.59,cf:0.09,tf:0.0,tb:0.0,tn:0.0},
{n:89,c:276581,f:"TUER",d:"Articulacao Cromada para spot 13mm x 35mm ROSCAS M10 e M8 180º - WHITE",ef:100.0,ed:100.0,mm:0.999,de:100.1,s:0.0,te:100.0,dt:100.1,cf:0.58,tf:0.0,tb:0.0,tn:0.0},
{n:90,c:276580,f:"TUER",d:"Articulacao Cromada para spot 13mm x 35mm ROSCAS M10 e M8 180º - BLACK",ef:100.0,ed:100.0,mm:0.999,de:100.1,s:0.0,te:100.0,dt:100.1,cf:0.58,tf:0.0,tb:0.0,tn:0.0},
{n:91,c:190146,f:"TUER",d:"Articulacao Cromada para spot 13mm x 35mm ROSCAS M10 e M8",ef:89.0,ed:87.0,mm:1.0,de:87.0,s:0.0,te:87.0,dt:87.0,cf:0.58,tf:0.0,tb:0.0,tn:0.0},
{n:92,c:180022,f:"TUER",d:"ARTICULAÇÃO DE LATÃO NATURAL PARA SPOT PEN Ø1/2\" x 54,5mm (CROMADA)",ef:1387.0,ed:1387.0,mm:7.0,de:198.14,s:0.0,te:1387.0,dt:198.14,cf:0.86,tf:0.0,tb:0.0,tn:0.0},
{n:93,c:246180,f:"TUER",d:"MICROCANOPLA CÔNICA DE REGULAGEM COMPLETA ( CROMADA - TUER)",ef:188.0,ed:188.0,mm:0.999,de:188.19,s:0.0,te:188.0,dt:188.19,cf:0.8,tf:0.0,tb:0.0,tn:0.0},
{n:94,c:266671,f:"TUER",d:"ARTICULAÇÃO PARA SPOT Ø1/2\" x 54,5mm (TE-D4032) TUER (TOTALMENTE OXIDADO PRETA)",ef:300.0,ed:300.0,mm:0.999,de:300.3,s:0.0,te:300.0,dt:300.3,cf:0.85,tf:0.0,tb:0.0,tn:0.0},
{n:95,c:266672,f:"TUER",d:"ARTICULAÇÃO PARA SPOT Ø1/2\" x 82mm (TE-D4038) TUER (TOTALMENTE OXIDADO PRETA)",ef:300.0,ed:300.0,mm:0.999,de:300.3,s:0.0,te:300.0,dt:300.3,cf:1.02,tf:0.0,tb:0.0,tn:0.0},
{n:96,c:180023,f:"TUER",d:"ARTICULAÇÃO DE LATÃO CROMADO PARA SPOT PEN Ø1/2\" x 82mm",ef:644.0,ed:644.0,mm:0.999,de:644.64,s:0.0,te:644.0,dt:644.64,cf:0.9,tf:0.0,tb:0.0,tn:0.0},
{n:97,c:189860,f:"TUER",d:"ARTICULAÇÃO REDONDA DE LATÃO NATURAL PARA SISTEMA VUU",ef:1312.0,ed:1311.0,mm:3.0,de:437.0,s:0.0,te:1311.0,dt:437.0,cf:1.07,tf:0.0,tb:0.0,tn:0.0},
{n:98,c:238598,f:"TUER",d:"ARTICULAÇÃO PARA STRONG SPOT D=22mm H=42mm",ef:1094.0,ed:1092.0,mm:2.0,de:546.0,s:0.0,te:1092.0,dt:546.0,cf:0.65,tf:0.0,tb:0.0,tn:0.0},
{n:99,c:162744,f:"TUER",d:"ARTICULAÇÃO DE LATÃO PARA SPOT PEN Ø1/2\" x 82mm (SEM ACABAMENTO)",ef:1887.0,ed:1687.0,mm:0.999,de:1688.69,s:0.0,te:1687.0,dt:1688.69,cf:0.9,tf:0.0,tb:0.0,tn:0.0},
{n:100,c:162743,f:"TUER",d:"ARTICULAÇÃO DE LATÃO NATURAL PARA SPOT PEN Ø1/2\" x 54,5mm (SEM ACABAMENTO)",ef:3467.0,ed:3466.0,mm:3.0,de:1155.33,s:0.0,te:3466.0,dt:1155.33,cf:0.73,tf:0.0,tb:0.0,tn:0.0},
{n:101,c:255344,f:"U-POLEMAG",d:"IMA DE NEODIMIO PERSONALIZADO EM \"H\" 5mm x 3,5mm x 45mm",ef:477.0,ed:23.0,mm:122.0,de:0.19,s:950.0,te:973.0,dt:7.98,cf:0.967,tf:918.65,tb:4890.16,tn:9780.32}
];

const DOLLAR = 5.3232;
const CL = ["#06D6A0","#118AB2","#EF476F","#FFD166","#073B4C","#8338EC","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DFE6E9","#E17055","#00B894","#6C5CE7","#FD79A8"];
const fmt = (v,d=0) => v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const fU = v => `$ ${fmt(v,2)}`;
const fB = v => `R$ ${fmt(v,2)}`;

const TT = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (<div style={{background:'#1a1f2e',border:'1px solid #2d3548',borderRadius:8,padding:'10px 14px',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
    <p style={{color:'#94a3b8',fontSize:12,margin:0}}>{label}</p>
    {payload.map((p,i)=>(<p key={i} style={{color:p.color||'#06D6A0',fontSize:13,fontWeight:600,margin:'4px 0 0'}}>
      {p.name}: {typeof p.value==='number'?(p.value<200?p.value.toFixed(2):fmt(p.value)):p.value}
    </p>))}
  </div>);
};

export default function Dashboard() {
  const [supFilter, setSupFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("compra");
  const [sortCol, setSortCol] = useState("tf");
  const [sortDir, setSortDir] = useState("desc");
  const [tab, setTab] = useState("overview");

  const suppliers = useMemo(() => [...new Set(RAW.map(d=>d.f))].sort(), []);

  const filtered = useMemo(() => {
    let d = RAW;
    if(supFilter!=="ALL") d = d.filter(i=>i.f===supFilter);
    if(search) d = d.filter(i=>i.d.toLowerCase().includes(search.toLowerCase())||i.c.toString().includes(search));
    if(viewMode==="compra") d = d.filter(i=>i.s>0);
    return d;
  }, [supFilter, search, viewMode]);

  const purch = useMemo(() => RAW.filter(i=>i.s>0), []);

  const kpi = useMemo(() => {
    const tQ = purch.reduce((s,i)=>s+i.s,0);
    const tF = purch.reduce((s,i)=>s+i.tf,0);
    const tB = purch.reduce((s,i)=>s+i.tb,0);
    const tN = purch.reduce((s,i)=>s+i.tn,0);
    const sups = new Set(purch.map(i=>i.f));
    return {total:RAW.length,pItems:purch.length,tQ,tF,tB,tN,sups:sups.size,avg:tF/(tQ||1)};
  }, [purch]);

  const supData = useMemo(() => {
    const m = {};
    purch.forEach(i => {
      if(!m[i.f]) m[i.f]={name:i.f,items:0,qty:0,fob:0,brl:0,nac:0};
      m[i.f].items++; m[i.f].qty+=i.s; m[i.f].fob+=i.tf; m[i.f].brl+=i.tb; m[i.f].nac+=i.tn;
    });
    return Object.values(m).sort((a,b)=>b.fob-a.fob).map(s=>({
      ...s, pV:(s.fob/kpi.tF*100), pQ:(s.qty/kpi.tQ*100), tk:s.fob/s.items, ac:s.fob/s.qty
    }));
  }, [purch, kpi]);

  const pareto = useMemo(() => {
    let cum=0;
    return [...supData].map(s=>{cum+=s.pV;return{...s,cumPct:cum};});
  }, [supData]);

  const itemRank = useMemo(() => [...purch].sort((a,b)=>b.tf-a.tf), [purch]);

  const sorted = useMemo(() => {
    const d = [...filtered];
    d.sort((a,b) => {
      const va=a[sortCol]??0, vb=b[sortCol]??0;
      if(typeof va==='string') return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va);
      return sortDir==='asc'?va-vb:vb-va;
    });
    return d;
  }, [filtered, sortCol, sortDir]);

  const doSort = useCallback(col => {
    if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc');
    else {setSortCol(col);setSortDir('desc');}
  }, [sortCol]);

  const riskItems = useMemo(() =>
    RAW.filter(i=>i.mm>0.999&&i.de<3&&i.de>=0).sort((a,b)=>a.de-b.de).slice(0,12)
  , []);

  const allSupData = useMemo(() => {
    const m = {};
    RAW.forEach(i => {
      if(!m[i.f]) m[i.f]={name:i.f,totalItems:0,purchItems:0,qty:0,fob:0};
      m[i.f].totalItems++;
      if(i.s>0){m[i.f].purchItems++;m[i.f].qty+=i.s;m[i.f].fob+=i.tf;}
    });
    return Object.values(m).sort((a,b)=>b.totalItems-a.totalItems);
  }, []);

  const S = {
    page:{fontFamily:"'Geist','SF Pro Display',-apple-system,sans-serif",background:'linear-gradient(160deg,#0a0e1a 0%,#0f1629 40%,#121a30 100%)',color:'#e2e8f0',minHeight:'100vh',padding:'20px 24px'},
    card:{background:'linear-gradient(135deg,rgba(30,41,59,.7),rgba(20,30,48,.8))',border:'1px solid rgba(100,116,139,.15)',borderRadius:14,padding:'18px 20px',backdropFilter:'blur(12px)'},
    kpi:c=>({background:'linear-gradient(135deg,rgba(30,41,59,.6),rgba(20,30,48,.7))',border:'1px solid rgba(100,116,139,.12)',borderRadius:14,padding:'16px 18px',overflow:'hidden',borderLeft:`3px solid ${c}`}),
    sel:{background:'#1a1f2e',border:'1px solid #2d3548',borderRadius:8,color:'#e2e8f0',padding:'8px 12px',fontSize:13,outline:'none',cursor:'pointer'},
    inp:{background:'#1a1f2e',border:'1px solid #2d3548',borderRadius:8,color:'#e2e8f0',padding:'8px 12px',fontSize:13,outline:'none',width:200},
    tab:a=>({padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',border:'none',background:a?'rgba(6,214,160,.15)':'transparent',color:a?'#06D6A0':'#64748b',transition:'all .2s'}),
    th:{padding:'10px 12px',textAlign:'left',fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'.5px',cursor:'pointer',userSelect:'none',borderBottom:'1px solid #1e293b',whiteSpace:'nowrap'},
    td:{padding:'10px 12px',fontSize:13,borderBottom:'1px solid rgba(30,41,59,.5)',whiteSpace:'nowrap'},
    pill:c=>({display:'inline-block',background:`${c}20`,color:c,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600}),
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:26,fontWeight:800,letterSpacing:'-0.5px',background:'linear-gradient(135deg,#06D6A0,#118AB2)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            ⚡ Torre de Controle — Importação
          </div>
          <div style={{fontSize:13,color:'#64748b',marginTop:2}}>ILUMINAR · Consolidado 1ª Reunião Março · Sugestão PCP</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {[`DÓLAR: R$ ${DOLLAR.toFixed(4)}`,`${RAW.length} ITENS · ${suppliers.length} FORNECEDORES`,`${purch.length} ITENS P/ COMPRA`].map((b,i)=>(
            <span key={i} style={{display:'inline-block',background:'rgba(6,214,160,.12)',color:'#06D6A0',padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:'.5px'}}>{b}</span>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:20}}>
        {[
          {l:'Itens na Planilha',v:kpi.total,c:'#4ECDC4',i:'📋'},
          {l:'Itens p/ Compra',v:kpi.pItems,c:'#06D6A0',i:'📦'},
          {l:'Qtd Total Sugerida',v:fmt(kpi.tQ),c:'#118AB2',i:'📊'},
          {l:'Total FOB (US$)',v:fU(kpi.tF),c:'#EF476F',i:'💵'},
          {l:'Total FOB (R$)',v:fB(kpi.tB),c:'#FFD166',i:'🇧🇷'},
          {l:'Total Nacionalizado',v:fB(kpi.tN),c:'#8338EC',i:'🏭'},
          {l:'Fornecedores c/ Compra',v:kpi.sups,c:'#45B7D1',i:'🏢'},
          {l:'Custo Médio/Un FOB $',v:fU(kpi.avg),c:'#FF6B6B',i:'📐'},
        ].map((k,i)=>(
          <div key={i} style={S.kpi(k.c)}>
            <div style={{fontSize:18,marginBottom:4}}>{k.i}</div>
            <div style={{fontSize:24,fontWeight:800,letterSpacing:'-0.5px',lineHeight:1.1,color:k.c}}>{k.v}</div>
            <div style={{fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',marginTop:6}}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,background:'rgba(30,41,59,.5)',borderRadius:10,padding:4,marginBottom:20,flexWrap:'wrap'}}>
        {[{id:'overview',l:'📊 Visão Geral'},{id:'ranking',l:'🏆 Rankings'},{id:'pareto',l:'📈 Pareto / ABC'},{id:'risk',l:'⚠️ Riscos'},{id:'table',l:'📋 Tabela Analítica'}].map(t=>(
          <button key={t.id} style={S.tab(tab===t.id)} onClick={()=>setTab(t.id)}>{t.l}</button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab==='overview'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:'#f1f5f9'}}>Participação por Fornecedor (Valor FOB)</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={supData} dataKey="fob" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} stroke="none">
                  {supData.map((_,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}
                </Pie>
                <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:11,color:'#94a3b8'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:'#f1f5f9'}}>Valor FOB por Fornecedor (US$)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={supData} layout="vertical" margin={{left:90}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis type="number" tick={{fill:'#64748b',fontSize:11}} tickFormatter={v=>`$${(v/1000).toFixed(1)}k`}/>
                <YAxis type="category" dataKey="name" tick={{fill:'#94a3b8',fontSize:11}} width={85}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="fob" name="FOB US$" radius={[0,6,6,0]}>
                  {supData.map((_,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:'#f1f5f9'}}>Quantidade Sugerida por Fornecedor</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={supData} layout="vertical" margin={{left:90}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis type="number" tick={{fill:'#64748b',fontSize:11}}/>
                <YAxis type="category" dataKey="name" tick={{fill:'#94a3b8',fontSize:11}} width={85}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="qty" name="Quantidade" radius={[0,6,6,0]}>
                  {supData.map((_,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:'#f1f5f9'}}>Comparativo: % Quantidade vs % Valor</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={supData} layout="vertical" margin={{left:90}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis type="number" tick={{fill:'#64748b',fontSize:11}} tickFormatter={v=>`${v.toFixed(0)}%`}/>
                <YAxis type="category" dataKey="name" tick={{fill:'#94a3b8',fontSize:11}} width={85}/>
                <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="pQ" name="% Quantidade" fill="#118AB2" radius={[0,4,4,0]}/>
                <Bar dataKey="pV" name="% Valor" fill="#EF476F" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Supplier overview table */}
          <div style={{...S.card,gridColumn:'1/-1'}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:'#f1f5f9'}}>📋 Mapa Completo de Fornecedores (Todos os 16)</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  {['Fornecedor','Total Itens','Itens c/ Compra','Qtd Sugerida','FOB US$','% do Total'].map(h=>(<th key={h} style={S.th}>{h}</th>))}
                </tr></thead>
                <tbody>
                  {allSupData.map((s,i)=>(
                    <tr key={i} style={{background:i%2===0?'transparent':'rgba(30,41,59,.3)'}}>
                      <td style={{...S.td,fontWeight:600}}><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:CL[i%CL.length],marginRight:8}}></span>{s.name}</td>
                      <td style={S.td}>{s.totalItems}</td>
                      <td style={{...S.td,color:s.purchItems>0?'#06D6A0':'#475569',fontWeight:s.purchItems>0?700:400}}>{s.purchItems||'—'}</td>
                      <td style={S.td}>{s.qty>0?fmt(s.qty):'—'}</td>
                      <td style={{...S.td,color:s.fob>0?'#06D6A0':'#475569',fontWeight:s.fob>0?600:400}}>{s.fob>0?fU(s.fob):'—'}</td>
                      <td style={S.td}>{s.fob>0?(s.fob/kpi.tF*100).toFixed(1)+'%':'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div style={{...S.card,gridColumn:'1/-1',borderLeft:'3px solid #FFD166'}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:10,color:'#FFD166'}}>🔍 Insights Estratégicos</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,fontSize:13,lineHeight:1.6}}>
              <div>
                <div style={{color:'#EF476F',fontWeight:700,marginBottom:4}}>⚠️ Concentração Crítica</div>
                <div style={{color:'#cbd5e1'}}>
                  <strong style={{color:'#f1f5f9'}}>HUA FENG + HI ZEALED</strong> representam <strong style={{color:'#EF476F'}}>74%</strong> do valor total FOB. O item iLed S 2700 (HUA FENG #55) sozinho vale <strong style={{color:'#EF476F'}}>US$ 5.250</strong> — 39,8% de toda a compra.
                </div>
              </div>
              <div>
                <div style={{color:'#06D6A0',fontWeight:700,marginBottom:4}}>📦 Volume vs Valor</div>
                <div style={{color:'#cbd5e1'}}>
                  <strong style={{color:'#f1f5f9'}}>HI ZEALED</strong> lidera em quantidade (2.550 un, 38%) mas <strong style={{color:'#f1f5f9'}}>HUA FENG</strong> lidera em valor ($5.250, 39.8%) com apenas 600 un — custo unitário $8,75 vs $1,77 médio dos demais.
                </div>
              </div>
              <div>
                <div style={{color:'#8338EC',fontWeight:700,marginBottom:4}}>💰 Fator Nacionalização</div>
                <div style={{color:'#cbd5e1'}}>
                  O custo nacionalizado (R$ {fmt(kpi.tN,2)}) é <strong style={{color:'#8338EC'}}>2x o FOB em reais</strong> (R$ {fmt(kpi.tB,2)}). Impostos e logística dobram o custo de entrada no estoque.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ RANKING ═══ */}
      {tab==='ranking'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:'#f1f5f9'}}>🏆 Top Itens por Valor FOB (US$)</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={itemRank} layout="vertical" margin={{left:20,right:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis type="number" tick={{fill:'#64748b',fontSize:11}} tickFormatter={v=>`$${v.toLocaleString()}`}/>
                <YAxis type="category" dataKey="d" tick={{fill:'#94a3b8',fontSize:9}} width={200}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="tf" name="FOB US$" radius={[0,6,6,0]}>
                  {itemRank.map((_,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:'#f1f5f9'}}>📊 Top Itens por Quantidade Sugerida</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...purch].sort((a,b)=>b.s-a.s)} layout="vertical" margin={{left:20,right:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis type="number" tick={{fill:'#64748b',fontSize:11}}/>
                <YAxis type="category" dataKey="d" tick={{fill:'#94a3b8',fontSize:9}} width={200}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="s" name="Quantidade" radius={[0,6,6,0]}>
                  {[...purch].sort((a,b)=>b.s-a.s).map((_,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:'#f1f5f9'}}>💎 Itens por Custo Unitário FOB (US$)</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...purch].sort((a,b)=>b.cf-a.cf)} layout="vertical" margin={{left:20,right:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis type="number" tick={{fill:'#64748b',fontSize:11}} tickFormatter={v=>`$${v}`}/>
                <YAxis type="category" dataKey="d" tick={{fill:'#94a3b8',fontSize:9}} width={200}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="cf" name="Custo Unit. US$" radius={[0,6,6,0]}>
                  {[...purch].sort((a,b)=>b.cf-a.cf).map((_,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:14,color:'#f1f5f9'}}>📋 Detalhamento dos 14 Itens de Compra</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  {['#','Código','Fornecedor','Descrição','Sug.','FOB $','FOB R$','Nac. R$'].map(h=>(<th key={h} style={S.th}>{h}</th>))}
                </tr></thead>
                <tbody>
                  {itemRank.map((it,i)=>(
                    <tr key={i} style={{background:i%2===0?'transparent':'rgba(30,41,59,.3)'}}>
                      <td style={{...S.td,color:'#64748b'}}>{it.n}</td>
                      <td style={S.td}>{it.c}</td>
                      <td style={{...S.td,fontWeight:600}}>{it.f}</td>
                      <td style={{...S.td,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis'}}>{it.d}</td>
                      <td style={{...S.td,fontWeight:700,color:'#06D6A0'}}>{fmt(it.s)}</td>
                      <td style={{...S.td,fontWeight:600,color:'#06D6A0'}}>{fU(it.tf)}</td>
                      <td style={S.td}>{fB(it.tb)}</td>
                      <td style={S.td}>{fB(it.tn)}</td>
                    </tr>
                  ))}
                  <tr style={{borderTop:'2px solid #2d3548',fontWeight:800}}>
                    <td colSpan={4} style={{...S.td,textAlign:'right',color:'#FFD166'}}>TOTAL</td>
                    <td style={{...S.td,color:'#FFD166'}}>{fmt(kpi.tQ)}</td>
                    <td style={{...S.td,color:'#FFD166'}}>{fU(kpi.tF)}</td>
                    <td style={{...S.td,color:'#FFD166'}}>{fB(kpi.tB)}</td>
                    <td style={{...S.td,color:'#FFD166'}}>{fB(kpi.tN)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PARETO ═══ */}
      {tab==='pareto'&&(
        <div>
          <div style={S.card}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:4,color:'#f1f5f9'}}>📈 Curva ABC / Pareto — Fornecedores por Valor FOB</div>
            <div style={{fontSize:12,color:'#64748b',marginBottom:16}}>Classe A (até 80%) · Classe B (80-95%) · Classe C (95-100%)</div>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={pareto} margin={{left:20,right:30}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:11}}/>
                <YAxis yAxisId="l" tick={{fill:'#64748b',fontSize:11}} tickFormatter={v=>`$${(v/1000).toFixed(1)}k`}/>
                <YAxis yAxisId="r" orientation="right" tick={{fill:'#FFD166',fontSize:11}} tickFormatter={v=>`${v}%`} domain={[0,100]}/>
                <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:11}}/>
                <Bar yAxisId="l" dataKey="fob" name="FOB US$" radius={[6,6,0,0]}>
                  {pareto.map((e,i)=>(<Cell key={i} fill={e.cumPct<=80?'#EF476F':e.cumPct<=95?'#FFD166':'#06D6A0'}/>))}
                </Bar>
                <Line yAxisId="r" type="monotone" dataKey="cumPct" name="% Acumulado" stroke="#FFD166" strokeWidth={3} dot={{r:5,fill:'#FFD166'}}/>
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{display:'flex',gap:20,marginTop:14,justifyContent:'center',flexWrap:'wrap'}}>
              {[
                {l:'Classe A (≤80%)',c:'#EF476F',d:pareto.filter(p=>p.cumPct<=80).map(p=>`${p.name} (${p.pV.toFixed(1)}%)`).join(', ')||'N/A'},
                {l:'Classe B (80-95%)',c:'#FFD166',d:pareto.filter(p=>p.cumPct>80&&p.cumPct<=95).map(p=>`${p.name} (${p.pV.toFixed(1)}%)`).join(', ')||'N/A'},
                {l:'Classe C (>95%)',c:'#06D6A0',d:pareto.filter(p=>p.cumPct>95).map(p=>`${p.name} (${p.pV.toFixed(1)}%)`).join(', ')||'N/A'},
              ].map((x,i)=>(
                <div key={i} style={{background:`${x.c}10`,border:`1px solid ${x.c}30`,borderRadius:10,padding:'10px 16px',maxWidth:350}}>
                  <div style={{color:x.c,fontWeight:700,fontSize:13,marginBottom:2}}>{x.l}</div>
                  <div style={{color:'#cbd5e1',fontSize:12}}>{x.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{...S.card,marginTop:16}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:4,color:'#f1f5f9'}}>📊 Pareto por Item — Concentração de Valor</div>
            <div style={{fontSize:12,color:'#64748b',marginBottom:16}}>Os 3 primeiros itens concentram ~72% do valor total</div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={(()=>{
                const s=[...purch].sort((a,b)=>b.tf-a.tf);
                let cum=0;
                return s.map(i=>{cum+=(i.tf/kpi.tF*100);return{...i,cumPct:cum};});
              })()} margin={{left:20,right:30}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="d" tick={{fill:'#94a3b8',fontSize:8}} interval={0} angle={-30} textAnchor="end" height={90}/>
                <YAxis yAxisId="l" tick={{fill:'#64748b',fontSize:11}} tickFormatter={v=>`$${v.toLocaleString()}`}/>
                <YAxis yAxisId="r" orientation="right" tick={{fill:'#06D6A0',fontSize:11}} tickFormatter={v=>`${v}%`} domain={[0,100]}/>
                <Tooltip content={<TT/>}/>
                <Bar yAxisId="l" dataKey="tf" name="FOB US$" fill="#118AB2" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="cumPct" name="% Acumulado" stroke="#06D6A0" strokeWidth={2} dot={{r:3}}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ RISK ═══ */}
      {tab==='risk'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{...S.card,gridColumn:'1/-1'}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:4,color:'#EF476F'}}>⚠️ Itens com Estoque Crítico (Duração &lt; 3 meses)</div>
            <div style={{fontSize:12,color:'#64748b',marginBottom:14}}>Itens com consumo ativo (média &gt; 1/mês) e cobertura inferior a 3 meses</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  {['#','Item','Fornecedor','Est.Disp.','Média/mês','Duração','Sugestão','Status'].map(h=>(<th key={h} style={S.th}>{h}</th>))}
                </tr></thead>
                <tbody>
                  {riskItems.map((it,i)=>(
                    <tr key={i} style={{background:i%2===0?'transparent':'rgba(30,41,59,.3)'}}>
                      <td style={{...S.td,color:'#64748b'}}>{it.n}</td>
                      <td style={{...S.td,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{it.d}</td>
                      <td style={{...S.td,fontWeight:600}}>{it.f}</td>
                      <td style={S.td}>{fmt(it.ed)}</td>
                      <td style={S.td}>{fmt(it.mm)}</td>
                      <td style={S.td}><span style={S.pill(it.de<1?'#EF476F':it.de<2?'#FF6B6B':'#FFD166')}>{it.de.toFixed(1)}m</span></td>
                      <td style={{...S.td,fontWeight:600,color:it.s>0?'#06D6A0':'#64748b'}}>{it.s>0?fmt(it.s):'—'}</td>
                      <td style={S.td}>{it.s>0?<span style={S.pill('#06D6A0')}>Coberto</span>:<span style={S.pill('#EF476F')}>Sem sugestão</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{...S.card,borderLeft:'3px solid #EF476F'}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:10,color:'#EF476F'}}>🔴 Dependência de Fornecedor</div>
            <div style={{fontSize:13,color:'#cbd5e1',lineHeight:1.7}}>
              <p><strong style={{color:'#f1f5f9'}}>HUA FENG</strong> — 1 único item (#55 iLed S 2700) concentra <strong style={{color:'#EF476F'}}>39,8%</strong> do valor total ($5.250). Falha neste fornecedor compromete todo o abastecimento de módulos iLed S.</p>
              <p style={{marginTop:8}}><strong style={{color:'#f1f5f9'}}>HI ZEALED</strong> — 3 itens (#48, #49, #50) somam <strong style={{color:'#EF476F'}}>34,2%</strong> ($4.514). São os drivers core da linha: Multipoint 6x, iLed 500 e iLed 200.</p>
              <p style={{marginTop:8}}>Juntos = <strong style={{color:'#FFD166'}}>74%</strong> do investimento concentrado em 2 fornecedores.</p>
            </div>
          </div>

          <div style={{...S.card,borderLeft:'3px solid #06D6A0'}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:10,color:'#06D6A0'}}>✅ Cobertura da Compra</div>
            <div style={{fontSize:13,color:'#cbd5e1',lineHeight:1.7}}>
              <p>Dos <strong style={{color:'#f1f5f9'}}>101 itens</strong>, apenas <strong style={{color:'#06D6A0'}}>14</strong> possuem sugestão de compra (13,9%). Os 87 restantes têm estoque suficiente.</p>
              <p style={{marginTop:8}}><strong style={{color:'#f1f5f9'}}>DARKOO</strong> (30 itens) → 3 compras. Ópticas e molduras com estoque amplo.</p>
              <p style={{marginTop:8}}><strong style={{color:'#f1f5f9'}}>TUER</strong> (29 itens) → 3 compras. Articulações cromadas e microcanopla preta.</p>
              <p style={{marginTop:8}}><strong style={{color:'#f1f5f9'}}>U-POLEMAG</strong> (#101) → estoque crítico de 0,19 meses. Item mais urgente da planilha.</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TABLE ═══ */}
      {tab==='table'&&(
        <div>
          <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
            <select style={S.sel} value={supFilter} onChange={e=>setSupFilter(e.target.value)}>
              <option value="ALL">Todos Fornecedores</option>
              {suppliers.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <input style={S.inp} placeholder="🔍 Buscar item ou código..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <select style={S.sel} value={viewMode} onChange={e=>setViewMode(e.target.value)}>
              <option value="compra">Apenas c/ Sugestão (14)</option>
              <option value="todos">Todos os Itens (101)</option>
            </select>
            <span style={{fontSize:12,color:'#64748b'}}>{sorted.length} itens exibidos</span>
          </div>
          <div style={{...S.card,padding:0,overflow:'hidden'}}>
            <div style={{overflowX:'auto',maxHeight:540}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead style={{position:'sticky',top:0,background:'#141c2f',zIndex:2}}>
                  <tr>
                    {[{k:'n',l:'#'},{k:'c',l:'Código'},{k:'f',l:'Fornecedor'},{k:'d',l:'Descrição'},{k:'ed',l:'Est.Disp.'},{k:'mm',l:'Média/mês'},{k:'de',l:'Dur.Est.(m)'},{k:'s',l:'Sugestão'},{k:'cf',l:'Custo FOB $'},{k:'tf',l:'Total FOB $'},{k:'tb',l:'Total FOB R$'},{k:'tn',l:'Nac. R$'}].map(col=>(
                      <th key={col.k} style={S.th} onClick={()=>doSort(col.k)}>
                        {col.l} {sortCol===col.k?(sortDir==='desc'?'▼':'▲'):''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((it,i)=>(
                    <tr key={i} style={{background:i%2===0?'transparent':'rgba(30,41,59,.25)'}}>
                      <td style={{...S.td,color:'#64748b'}}>{it.n}</td>
                      <td style={S.td}>{it.c}</td>
                      <td style={{...S.td,fontWeight:600}}>{it.f}</td>
                      <td style={{...S.td,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis'}}>{it.d}</td>
                      <td style={S.td}>{fmt(it.ed)}</td>
                      <td style={S.td}>{it.mm>=1?fmt(it.mm):it.mm.toFixed(3)}</td>
                      <td style={S.td}>
                        {it.de<3&&it.mm>0.999?<span style={S.pill('#EF476F')}>{it.de.toFixed(1)}m</span>:<span>{it.de>100?'>100':it.de.toFixed(1)}</span>}
                      </td>
                      <td style={{...S.td,fontWeight:it.s>0?700:400,color:it.s>0?'#06D6A0':'#475569'}}>{it.s>0?fmt(it.s):'—'}</td>
                      <td style={S.td}>{fU(it.cf)}</td>
                      <td style={{...S.td,color:it.tf>0?'#06D6A0':'#475569',fontWeight:it.tf>0?600:400}}>{it.tf>0?fU(it.tf):'—'}</td>
                      <td style={S.td}>{it.tb>0?fB(it.tb):'—'}</td>
                      <td style={S.td}>{it.tn>0?fB(it.tn):'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div style={{textAlign:'center',marginTop:24,padding:'16px 0',borderTop:'1px solid #1e293b',color:'#475569',fontSize:11}}>
        Torre de Controle — Importação ILUMINAR · Consolidado 1ª Reunião Março · Dados: {RAW.length} itens | {purch.length} compras | {suppliers.length} fornecedores | FOB Total: {fU(kpi.tF)}
      </div>
    </div>
  );
}
