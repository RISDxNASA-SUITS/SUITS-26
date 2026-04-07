#ifndef SIM_ALGORITHMS_H
#define SIM_ALGORITHMS_H

#include "sim_engine.h"

//////////////Define Constants for Formula Evaluation//////////////////////////////
#define OXY_VENT_RATE 4.3f
#define OXY_FILL_RATE 2.5f
#define OXY_RATE 0.01f
#define OXY_ERROR_RATE 0.1f
#define CO2_RATE 0.01f
#define COOLANT_FILL_RATE 5.76f
#define COOLANT_DRAIN_RATE 6.78f
#define COOLANT_RATE 0.01f

///////////////////////////////////////////////////////////////////////////////////
//                           Algorithm Functions
///////////////////////////////////////////////////////////////////////////////////

// Algorithm update functions
sim_value_t sim_algo_sine_wave(sim_field_t* fielde);
sim_value_t sim_algo_linear_decay(sim_field_t* field);
sim_value_t sim_algo_linear_growth(sim_field_t* field);
sim_value_t sim_algo_dependent_value(sim_field_t* field, sim_engine_t* engine);
sim_value_t sim_algo_external_value(sim_field_t* field, sim_engine_t* engine);
sim_value_t sim_algo_constant_value(sim_field_t* field);

// Utility functions
float sim_algo_evaluate_formula(const char* formula, sim_engine_t* engine);
sim_algorithm_type_t sim_algo_parse_type_string(const char* algo_string);
const char* sim_algo_type_to_string(sim_algorithm_type_t type);

#endif // SIM_ALGORITHMS_H