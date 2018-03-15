package elastest.loganalyzer.es.client.resource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import elastest.loganalyzer.es.client.model.Execution;
import elastest.loganalyzer.es.client.model.Log;
import elastest.loganalyzer.es.client.model.Project;
import elastest.loganalyzer.es.client.service.ESLogService;
import elastest.loganalyzer.es.client.service.ESProjectService;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/logs")
public class LogResource {
	
	private final ESLogService esLogService;
	private final ESProjectService esProjectService;

	@Autowired
	public LogResource(ESLogService esLogService, ESProjectService esProjectService) {
		this.esLogService = esLogService;
		this.esProjectService = esProjectService;
	}

	@RequestMapping(value = "/id/{id}", method = RequestMethod.GET)
	public Log getById(@PathVariable String id) {
		Log log = esLogService.findOne(id);
		return log;
	}

	@RequestMapping(value = "/level/{level}", method = RequestMethod.GET)
	public ResponseEntity<List<Log>> getByLevel(@PathVariable String level,
			@RequestParam(name = "page", defaultValue = "0") int page,
			@RequestParam(name = "size", defaultValue = "10") int size) {
		List<Log> log = esLogService.findByLevel(level, page, size);

		return new ResponseEntity<>(log, HttpStatus.OK);
	}

	@RequestMapping(value = "/logger/{logger}", method = RequestMethod.GET)
	public List<?> getByLogger(@PathVariable String logger,
			@RequestParam(name = "project", required = true) String project,
			@RequestParam(name = "test", required = true) int test,
			@RequestParam(name = "method", required = false) String method) {
		String testNo = String.format("%02d", test);
		if (method == null) {
			List<Log> logs = esLogService.findByLoggerContainingIgnoreCaseAndProjectAndTestOrderByIdAsc(logger, project,
					testNo);
			List<String> methods = new ArrayList<String>();
			for (int i = 0; i < logs.size(); i++) {
				if (!methods.contains(logs.get(i).getMethod())) {
					methods.add(logs.get(i).getMethod());
				}
			}
			return methods;
		} else {
			return esLogService.findByLoggerContainingIgnoreCaseAndProjectAndTestAndMethodOrderByIdAsc(logger, project,
					testNo, method);
		}
	}

	@RequestMapping(value = "/project/{project}", method = RequestMethod.GET)
	public List<Execution> getByProject(@PathVariable String project) {
		Project target = esProjectService.findByName(project);
		List<Execution> execs = new ArrayList<Execution>();
		for (int i = 0; i < target.getNum_execs(); i++) {
			Execution execution = new Execution();
			execution.setId(i + 1);
			String test = String.format("%02d", i + 1);
			List<Log> logs = esLogService.findByTestAndProjectOrderByIdAsc(test, project);
			execution.setEntries(logs.size());
			Log selected = this.findLog(logs);
			execution.setTimestamp(selected.getTimestamp());
			execution.setDebug(esLogService.findByProjectAndTestAndLevel(test, project, "DEBUG"));
			execution.setInfo(esLogService.findByProjectAndTestAndLevel(test, project, "INFO"));
			execution.setWarning(esLogService.findByProjectAndTestAndLevel(test, project, "WARNING"));
			execution.setError(esLogService.findByProjectAndTestAndLevel(test, project, "ERROR"));
			logs = esLogService.findByProjectAndTestAndMessageContainingIgnoreCaseOrderByIdAsc(test, project, "BUILD");
			for (int j = 0; j < logs.size(); j++) {
				if (logs.get(j).getMessage().contains("BUILD ")) {
					if (logs.get(j).getMessage().length() < 2) {
						execution.setStatus("UNKNOWN");
					} else {
						execution.setStatus(logs.get(j).getMessage());
					}
					break;
				} else {
					execution.setStatus("FAILURE");
				}
			}
			execs.add(execution);
		}
		return execs;
	}

	@RequestMapping(value = "/test/{test}", method = RequestMethod.GET)
	public List<?> getByTest(@PathVariable int test, @RequestParam(value = "project", required = true) String project,
			@RequestParam(value = "classes", required = true) boolean classes, 
			@RequestParam(value = "maven", required = false) boolean maven) {
		String testNo = String.format("%02d", test);
		if (classes) {
			List<Log> logs = esLogService.findByProjectAndTestAndMessageContainingIgnoreCaseOrderByIdAsc(testNo,
					project, "Running");
			List<String> classL = new ArrayList<String>();
			for (Log log : logs) {
				classL.add(log.getMessage());
			}
			return classL;
		} else {
			if (project == null) {
				return esLogService.findByTestOrderByIdAsc(testNo);
			} else {
				if (!maven) {
					return esLogService.findByTestAndProjectAndThreadOrderByIdAsc(testNo, project, "main");
				} else {
					return esLogService.findByTestAndProjectOrderByIdAsc(testNo, project);
				}
			}
		}
	}

	@RequestMapping(value = "/remove/test/{test}", method = RequestMethod.DELETE)
	public String deleteByTestAndProject(@PathVariable int test,
			@RequestParam(value = "project", required = true) String project) {
		String testNo = String.format("%02d", test);
		List<Log> logs = esLogService.findByTestAndProjectOrderByIdAsc(testNo, project);
		Project target = esProjectService.findByName(project);
		int idDeleted = Integer.valueOf(testNo);
		target.setRecently_deleted(idDeleted);
		target.setNum_execs(target.getNum_execs() - 1);
		for (int i = 0; i < logs.size(); i++) {
			esLogService.delete(logs.get(i));
		}
		esProjectService.save(target);
		return "200";
	}

	private Log findLog(List<Log> logs) {
		for (int i = 0; i < logs.size(); i++) {
			if (logs.get(i).getTimestamp().indexOf("20") == 0) {
				return logs.get(i);
			}
		}
		return new Log();
	}
}