"use client"

import { useEffect, useMemo, useReducer, useRef } from "react";
import {
  createInitialState,
  reduceTimer,
  type TimerState,
  type Mode,
} from "./timerMachine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function formatMMSS(totalSec: number): string {
    const m = Math.floor(totalSec/60);
    const s = totalSec % 60;

    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function Timer(){
    const [state,dispatch] = useReducer(reduceTimer,undefined,createInitialState);

    const intervalRef = useRef<number | null>(null);

    useEffect(()=>{
        //clear existing intervals
        if(intervalRef.current != null){
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;

        } 

        if(state.status === "RUNNING" || state.status === "PAUSED")
        {
            intervalRef.current = window.setInterval(()=>{
                dispatch({type: "TICK", nowMs: Date.now()});
            },250);
        }
        return () =>{
            if(intervalRef.current != null){
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;

        } 
        };

    },[state.status]);


    const presets = useMemo(()=> [25,45,60],[]);
    const currentMinutes = Math.round(state.targetDurationSec/60);

    const isIdle = state.status === "IDLE";
    const isRunning = state.status === "RUNNING";
    const isPaused = state.status === "PAUSED";
    const isComplete = state.status === "COMPLETE";

    return(
        <Card className="p-6 max-w-md mx-auto space-y-6">
            <div className="text-center">
                <div className="text-sm opacity-70">{state.mode}</div>
                <div className="text-6xl font-semibold tabular-nums">{formatMMSS(state.remainingSec)}</div>
                {isComplete && (<div className="mt-2 text-sm font-medium">Session Complete</div>)}
            </div>
            
            {/*Presets*/}
             <div className="flex gap-2 justify-center flex-wrap">
        {presets.map((m) => (
          <Button
            key={m}
            variant="outline"
            disabled={!(isIdle || isComplete)}
            onClick={() =>
              dispatch({ type: "SET_DURATION_SEC", seconds: m * 60 })
            }
          >
            {m}m
          </Button>
        ))}
      </div>

      {/* Custom minutes */}
      <div className="flex items-center gap-2 justify-center">
        <Input
          className="w-28"
          type="number"
          min={1}
          max={360}
          disabled={!(isIdle || isComplete)}
          value={currentMinutes}
          onChange={(e) => {
            const nextMin = Number(e.target.value || 0);
            dispatch({ type: "SET_DURATION_SEC", seconds: nextMin * 60 });
          }}
        />
        <span className="text-sm opacity-70">minutes</span>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {(isIdle || isComplete) && (
            <Button onClick={()=> dispatch({ type: "START", nowMs: Date.now()})}>
                Start
            </Button>
        )}
        {isRunning && (
            <Button variant="secondary" onClick={()=> dispatch({type: "PAUSE", nowMs: Date.now()})}>
                Pause
            </Button>
        )}

        <Button variant="outline" onClick={()=> dispatch({type: "RESET"})}>
            Reset
        </Button>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {(["FOCUS", "SHORT_BREAK", "LONG_BREAK"] as Mode[]).map((mode) => (
          <Button
            key={mode}
            variant={state.mode === mode ? "default" : "outline"}
            disabled={!(isIdle || isComplete)}
            onClick={() => dispatch({ type: "SET_MODE", mode })}
          >
            {mode === "FOCUS" ? "Focus" : mode === "SHORT_BREAK" ? "Short" : "Long"}
          </Button>
        ))}
      </div>





        </Card>

        
    );
}

