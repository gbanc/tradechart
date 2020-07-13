import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import * as React from "react";
import { Chart, ChartCanvas } from "react-financial-charts";
import { XAxis, YAxis } from "react-financial-charts/lib/axes";
import { CrossHairCursor, EdgeIndicator, MouseCoordinateX, MouseCoordinateY } from "react-financial-charts/lib/coordinates";
import { elderRay, ema } from "react-financial-charts/lib/indicator";
import { ZoomButtons } from "react-financial-charts/lib/interactive";
import { discontinuousTimeScaleProviderBuilder } from "react-financial-charts/lib/scale";
import { BarSeries, CandlestickSeries, ElderRaySeries, LineSeries } from "react-financial-charts/lib/series";
import { MovingAverageTooltip, HoverTooltip, OHLCTooltip, SingleValueTooltip } from "react-financial-charts/lib/tooltip";
import { withDeviceRatio } from "react-financial-charts/lib/utils";
import { lastVisibleItemBasedZoomAnchor } from "react-financial-charts/lib/utils/zoomBehavior";
import { IOHLCData, withOHLCData, withSize } from "../data";
import { Annotate, SvgPathAnnotation, buyPath, sellPath} from "react-financial-charts/lib/annotation";
import algo from "../data/algo"

interface StockChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly dateTimeFormat?: string;
    readonly width: number;
    readonly ratio: number;
}

const dateFormat = timeFormat("%Y-%m-%d");
const numberFormat = format(".2f");

function tooltipContent(ys) {
	return ({ currentItem, xAccessor }) => {
		return {
			x: dateFormat(xAccessor(currentItem)),
			y: [
				{
					label: "open",
					value: currentItem.open && numberFormat(currentItem.open)
				},
				{
					label: "high",
					value: currentItem.high && numberFormat(currentItem.high)
				},
				{
					label: "low",
					value: currentItem.low && numberFormat(currentItem.low)
				},
				{
					label: "close",
					value: currentItem.close && numberFormat(currentItem.close)
				}
			]
				.concat(
					ys.map(each => ({
						label: each.label,
						value: each.value(currentItem),
						stroke: each.stroke
					}))
				)
				.filter(line => line.value)
		};
	};
}

class StockChart extends React.Component<StockChartProps> {

    private readonly margin = { left: 0, right: 48, top: 0, bottom: 24 };
    private readonly pricesDisplayFormat = format(".2f");
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder()
        .inputDateAccessor((d: IOHLCData) => d.date);

    public render() {

        const {
            data: initialData,
            dateTimeFormat = "%d %b",
            height,
            ratio,
            width,
        } = this.props;

        const ema12 = ema()
            .id(1)
            .options({ windowSize: 12 })
            .merge((d: any, c: any) => { d.ema12 = c; })
            .accessor((d: any) => d.ema12);

        const ema26 = ema()
            .id(2)
            .options({ windowSize: 26 })
            .merge((d: any, c: any) => { d.ema26 = c; })
            .accessor((d: any) => d.ema26);

		const buySell = algo()
			.windowSize(2)
			.accumulator(([prev, now]) => {
				const { ema12: prevShortTerm, ema26: prevLongTerm } = prev;
				const { ema12: nowShortTerm, ema26: nowLongTerm } = now;
				if (prevShortTerm < prevLongTerm && nowShortTerm > nowLongTerm) return "LONG";
				if (prevShortTerm > prevLongTerm && nowShortTerm < nowLongTerm) return "SHORT";
			})
			.merge((d, c) => { d.longShort = c; });

		const defaultAnnotationProps = {
			onClick: console.log.bind(console),
		};

		const longAnnotationProps = {
			...defaultAnnotationProps,
			y: ({ yScale, datum }) => yScale(datum.low),
			fill: "#006517",
			path: buyPath,
			tooltip: "Go long",
		};

		const shortAnnotationProps = {
			...defaultAnnotationProps,
			y: ({ yScale, datum }) => yScale(datum.high),
			fill: "#FF0000",
			path: sellPath,
			tooltip: "Go short",
		};



        const elder = elderRay();

        const calculatedData = buySell(ema26(ema12(initialData)));

        const { margin, xScaleProvider } = this;

        const {
            data,
            xScale,
            xAccessor,
            displayXAccessor,
        } = xScaleProvider(calculatedData);

        const start = xAccessor(data[data.length - 1]);
        const end = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [start, end];

        const gridHeight = height - margin.top - margin.bottom;

        const elderRayHeight = 100;
        const elderRayOrigin = (_: number, h: number) => [0, h - elderRayHeight];
        const barChartHeight = gridHeight / 4;
        const barChartOrigin = (_: number, h: number) => [0, h - barChartHeight - elderRayHeight];
        const chartHeight = gridHeight - elderRayHeight;

        const timeDisplayFormat = timeFormat(dateTimeFormat);

        return (
            <ChartCanvas
                height={height}
                ratio={ratio}
                width={width}
                margin={margin}
                data={data}
                displayXAccessor={displayXAccessor}
                seriesName="Data"
                xScale={xScale}
                xAccessor={xAccessor}
                xExtents={xExtents}
                zoomAnchor={lastVisibleItemBasedZoomAnchor}>
                <Chart
                    id={2}
                    height={barChartHeight}
                    origin={barChartOrigin}
                    yExtents={this.barChartExtents}>
                    <BarSeries
                        fill={this.openCloseColor}
                        yAccessor={this.yBarSeries} />
                </Chart>
                <Chart
                    id={3}
                    height={chartHeight}
                    yExtents={this.candleChartExtents}>
                    <XAxis
                        showGridLines
                        showTickLabel={false} />
                    <YAxis
                        showGridLines
                        tickFormat={this.pricesDisplayFormat} />
                    <CandlestickSeries />
                    <LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()} />
                    <LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()} />
                    <MouseCoordinateY
                        rectWidth={margin.right}
                        displayFormat={this.pricesDisplayFormat} />
                    <EdgeIndicator
                        itemType="last"
                        rectWidth={margin.right}
                        fill={this.openCloseColor}
                        lineStroke={this.openCloseColor}
                        displayFormat={this.pricesDisplayFormat}
                        yAccessor={this.yEdgeIndicator} />
                    <MovingAverageTooltip
                        origin={[8, 24]}
                        options={[
                            {
                                yAccessor: ema26.accessor(),
                                type: "EMA",
                                stroke: ema26.stroke(),
                                windowSize: ema26.options().windowSize,
                            },
                            {
                                yAccessor: ema12.accessor(),
                                type: "EMA",
                                stroke: ema12.stroke(),
                                windowSize: ema12.options().windowSize,
                            },
                        ]}
                    />

                    <ZoomButtons />
					<HoverTooltip
						yAccessor={ema26.accessor()}
						tooltipContent={tooltipContent([
							{
								label: `${ema12.type()}(${ema12.options()
									.windowSize})`,
								value: d => this.pricesDisplayFormat(ema12.accessor()(d)),
								stroke: ema12.stroke()
							},
							{
								label: `${ema26.type()}(${ema26.options()
									.windowSize})`,
								value: d => this.pricesDisplayFormat(ema26.accessor()(d)),
								stroke: ema26.stroke()
							}
						])}
						fontSize={15}
					/>
                    <OHLCTooltip origin={[8, 16]} />
					<Annotate with={SvgPathAnnotation} when={d => d.longShort === "LONG"}
						usingProps={longAnnotationProps} />
					<Annotate with={SvgPathAnnotation} when={d => d.longShort === "SHORT"}
						usingProps={shortAnnotationProps} />



                </Chart>
                <Chart
                    id={4}
                    height={elderRayHeight}
                    yExtents={[0, elder.accessor()]}
                    origin={elderRayOrigin}
                    padding={{ top: 8, bottom: 8 }}>
                    <XAxis
                        showGridLines
                        gridLinesStroke="#e0e3eb" />
                    <YAxis
                        ticks={4}
                        tickFormat={this.pricesDisplayFormat} />

                    <MouseCoordinateX displayFormat={timeDisplayFormat} />
                    <MouseCoordinateY rectWidth={margin.right} displayFormat={this.pricesDisplayFormat} />

                    <ElderRaySeries yAccessor={elder.accessor()} />

                    <SingleValueTooltip
                        yAccessor={elder.accessor()}
                        yLabel="Elder Ray"
                        yDisplayFormat={(d: any) => `${this.pricesDisplayFormat(d.bullPower)}, ${this.pricesDisplayFormat(d.bearPower)}`}
                        origin={[8, 16]} />
                        


                </Chart>
                <CrossHairCursor />
            </ChartCanvas>
        );
    }

    private readonly barChartExtents = (data: IOHLCData) => {
        return data.volume;
    }

    private readonly candleChartExtents = (data: IOHLCData) => {
        return [data.high, data.low];
    }

    private readonly yBarSeries = (data: IOHLCData) => {
        return data.volume;
    }

    private readonly yEdgeIndicator = (data: IOHLCData) => {
        return data.close;
    }

    private readonly openCloseColor = (data: IOHLCData) => {
        return data.close > data.open ? "#26a69a" : "#ef5350";
    }
}

export default withOHLCData()(withSize(600)(withDeviceRatio()(StockChart)));
export const IntradayStockChart = withOHLCData("MSFT_INTRA_DAY")(withSize(600)(withDeviceRatio()(StockChart)));